package service

import (
	"context"
	"errors"
	"testing"

	domainlabel "github.com/Star1ex/starlex-site/internal/domain/label"
	domainworkspace "github.com/Star1ex/starlex-site/internal/domain/workspace"
)

type labelRepoMock struct {
	labels map[string]*domainlabel.Label
}

func newLabelRepoMock(labels ...*domainlabel.Label) *labelRepoMock {
	repo := &labelRepoMock{labels: map[string]*domainlabel.Label{}}
	for _, label := range labels {
		repo.labels[label.ID] = label
	}
	return repo
}

func (m *labelRepoMock) Create(_ context.Context, label *domainlabel.Label) error {
	m.labels[label.ID] = label
	return nil
}

func (m *labelRepoMock) GetByID(_ context.Context, id string) (*domainlabel.Label, error) {
	label, ok := m.labels[id]
	if !ok {
		return nil, domainlabel.ErrLabelNotFound
	}
	return label, nil
}

func (m *labelRepoMock) ListByWorkspace(_ context.Context, workspaceID string) ([]*domainlabel.Label, error) {
	var labels []*domainlabel.Label
	for _, label := range m.labels {
		if label.WorkspaceID == workspaceID {
			labels = append(labels, label)
		}
	}
	return labels, nil
}

func (m *labelRepoMock) Update(_ context.Context, id string, name *string, color *string) (*domainlabel.Label, error) {
	label, err := m.GetByID(context.Background(), id)
	if err != nil {
		return nil, err
	}
	if name != nil {
		label.Name = *name
	}
	if color != nil {
		label.Color = *color
	}
	return label, nil
}

func (m *labelRepoMock) Delete(_ context.Context, id string) error {
	if _, ok := m.labels[id]; !ok {
		return domainlabel.ErrLabelNotFound
	}
	delete(m.labels, id)
	return nil
}

func TestLabelServiceCreate(t *testing.T) {
	tests := []struct {
		name          string
		requesterRole domainworkspace.Role
		labelName     string
		color         string
		wantErr       error
	}{
		{name: "admin can create label", requesterRole: domainworkspace.RoleAdmin, labelName: "Bug", color: "#ff0033"},
		{name: "guest cannot create label", requesterRole: domainworkspace.RoleGuest, labelName: "Bug", color: "#ff0033", wantErr: ErrWorkspaceForbidden},
		{name: "empty name rejected", requesterRole: domainworkspace.RoleAdmin, labelName: " ", color: "#ff0033", wantErr: domainlabel.ErrInvalidName},
		{name: "bad color rejected", requesterRole: domainworkspace.RoleAdmin, labelName: "Bug", color: "red", wantErr: domainlabel.ErrInvalidColor},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			workspaceRepo := newWorkspaceRoleRepo()
			workspaceRepo.roles["ws1"] = map[string]domainworkspace.Role{"requester": tt.requesterRole}
			labelRepo := newLabelRepoMock()
			service := NewLabelService(labelRepo, workspaceRepo)

			label, err := service.Create(context.Background(), "ws1", tt.labelName, tt.color, "requester")
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("want error %v, got %v", tt.wantErr, err)
			}
			if tt.wantErr == nil {
				if label.ID == "" || label.Name != "Bug" || label.Color != "#ff0033" {
					t.Fatalf("unexpected label: %#v", label)
				}
			}
		})
	}
}

func TestLabelServiceListUpdateDelete(t *testing.T) {
	workspaceRepo := newWorkspaceRoleRepo()
	workspaceRepo.roles["ws1"] = map[string]domainworkspace.Role{
		"guest": domainworkspace.RoleGuest,
		"admin": domainworkspace.RoleAdmin,
	}
	labelRepo := newLabelRepoMock(&domainlabel.Label{ID: "label1", WorkspaceID: "ws1", Name: "Bug", Color: "#ff0033"})
	service := NewLabelService(labelRepo, workspaceRepo)

	labels, err := service.ListByWorkspace(context.Background(), "ws1", "guest")
	if err != nil {
		t.Fatalf("guest should list labels: %v", err)
	}
	if len(labels) != 1 {
		t.Fatalf("want 1 label, got %d", len(labels))
	}

	nextName := "Feature"
	nextColor := "#00aa88"
	updated, err := service.Update(context.Background(), "label1", &nextName, &nextColor, "admin")
	if err != nil {
		t.Fatalf("admin should update label: %v", err)
	}
	if updated.Name != nextName || updated.Color != nextColor {
		t.Fatalf("unexpected updated label: %#v", updated)
	}

	if _, err := service.Update(context.Background(), "label1", &nextName, nil, "guest"); !errors.Is(err, ErrWorkspaceForbidden) {
		t.Fatalf("guest update want forbidden, got %v", err)
	}

	if err := service.Delete(context.Background(), "label1", "admin"); err != nil {
		t.Fatalf("admin should delete label: %v", err)
	}
	if _, ok := labelRepo.labels["label1"]; ok {
		t.Fatalf("label was not deleted")
	}
}
