package team


type Team struct{
	ID string
	Name string
	Description string
}

func NewTeam(id,name,description string)*Team{
	return &Team{
		ID: id,
		Name: name,
		Description: description,
	}
}