import React, { useEffect, useState } from "react";
import { X, Plus, Trash2, UserPlus } from "lucide-react";

const apiFetch = async (url: string, options?: any) => {
  console.log("API Call:", url, options);
  return new Promise((resolve) => setTimeout(() => resolve({}), 500));
};

type Task = {
  id: string;
  task: string;
  description: string;
  assignedTo: User[];
  progress: string;
  priority: string;
};

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  role?: string;
  photo_url?: string;
};

export default function TaskBoard() {
  const teamId = "demo-team-id";
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  
  const [newTask, setNewTask] = useState({
    task: "",
    description: "",
    priority: "Medium",
    user_id: [] as string[],
  });

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newUserEmail, setNewUserEmail] = useState("");

  const columns = [
    { id: "todo", title: "To Do" },
    { id: "in_progress", title: "In Progress" },
    { id: "done", title: "Done" },
  ];

  const priorityBgColors = {
    Low: "#D4C7BD",
    Medium: "#C8B8A9", 
    High: "#B89C8A",
  };

  useEffect(() => {
    loadData();
  }, [teamId]);

  async function loadData() {
    setLoading(true);
    try {
      const tasksData = await apiFetch(`/api/team/${teamId}/tasks`);
      const teamData = await apiFetch(`/api/team/${teamId}`);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setUsers(Array.isArray(teamData) ? teamData : []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function createTask() {
    try {
      await apiFetch(`/api/team/${teamId}/tasks`, {
        method: "POST",
        body: JSON.stringify({ ...newTask, progress: "todo" }),
      });
      await loadData();
      setShowCreateTask(false);
      setNewTask({ task: "", description: "", priority: "Medium", user_id: [] });
    } catch (error) {
      alert("Failed to create task");
    }
  }

  async function updateTask() {
    if (!editingTask) return;
    try {
      await apiFetch(`/api/team/${teamId}/tasks/${editingTask.id}`, {
        method: "PUT",
        body: JSON.stringify({
          task: editingTask.task,
          description: editingTask.description,
          priority: editingTask.priority,
          progress: editingTask.progress,
          user_id: editingTask.assignedTo.map(u => u.id),
        }),
      });
      await loadData();
      setShowEditTask(false);
      setEditingTask(null);
    } catch (error) {
      alert("Failed to update task");
    }
  }

  async function deleteTask(id: string) {
    if (!confirm("Are you sure?")) return;
    try {
      await apiFetch(`/api/team/${teamId}/tasks/${id}`, { method: "DELETE" });
      setTasks(prev => prev.filter(t => t.id !== id));
      setShowEditTask(false);
      setEditingTask(null);
    } catch (error) {
      alert("Failed to delete task");
    }
  }

  async function addUserToTeam() {
    if (!newUserEmail.trim()) return;
    try {
      await apiFetch(`/api/team/${teamId}/add`, {
        method: "POST",
        body: JSON.stringify({ email: newUserEmail }),
      });
      await loadData();
      setShowAddUser(false);
      setNewUserEmail("");
    } catch (error) {
      alert("Failed to add user");
    }
  }

  const InputField = ({ value, onChange, placeholder, multiline = false }: any) => (
    multiline ? (
      <textarea
        className="w-full p-3 border-2 rounded-xl outline-none transition-all resize-none"
        style={{ borderColor: '#DDD0C4', backgroundColor: '#FFFFFF', color: '#4A3F39' }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#9B8B7E';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(155, 139, 126, 0.1)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#DDD0C4';
          e.currentTarget.style.boxShadow = 'none';
        }}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={3}
      />
    ) : (
      <input
        className="w-full p-3 border-2 rounded-xl outline-none transition-all"
        style={{ borderColor: '#DDD0C4', backgroundColor: '#FFFFFF', color: '#4A3F39' }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#9B8B7E';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(155, 139, 126, 0.1)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#DDD0C4';
          e.currentTarget.style.boxShadow = 'none';
        }}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    )
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: '#E8DDD3' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: '#A69282', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8DDD3' }}>
      
      <div className="lg:hidden shadow-md p-4 flex items-center justify-between sticky top-0 z-30" style={{ backgroundColor: '#F3E6DB' }}>
        <h1 className="text-xl font-bold" style={{ color: '#4A3F39' }}>TaskBoard</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowUserPanel(!showUserPanel)} className="p-2 rounded-lg transition-colors" style={{ backgroundColor: '#DDD0C4', color: '#6B5B4F' }}>
            <UserPlus size={20} />
          </button>
          <button onClick={() => setShowCreateTask(true)} className="p-2 rounded-lg text-white transition-colors" style={{ backgroundColor: '#9B8B7E' }}>
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-screen lg:overflow-hidden">
        
        <div className={`${showUserPanel ? 'fixed inset-0 z-40 lg:relative' : 'hidden lg:block'} lg:w-80 overflow-y-auto`} style={{ backgroundColor: '#F7EFE7', borderRight: '1px solid #DDD0C4' }}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold" style={{ color: '#4A3F39' }}>Team Members</h3>
              <button onClick={() => setShowAddUser(true)} className="p-2 rounded-full transition-all hover:scale-110" style={{ backgroundColor: '#DDD0C4', color: '#6B5B4F' }}>
                <Plus size={18} />
              </button>
              <button onClick={() => setShowUserPanel(false)} className="lg:hidden p-2">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:scale-102">
                  {u.photo_url ? (
                    <img src={u.photo_url} className="w-10 h-10 rounded-full object-cover" style={{ border: '2px solid #DDD0C4' }} alt="" />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: '#A69282' }}>
                      {u.firstName[0]}{u.lastName[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: '#4A3F39' }}>{u.firstName} {u.lastName}</p>
                    <p className="text-xs font-medium" style={{ color: '#8A7A6D' }}>{u.role || "Member"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-auto p-4 lg:p-8">
          <div className="hidden lg:flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold" style={{ color: '#4A3F39' }}>Task Board</h2>
            <button onClick={() => setShowCreateTask(true)} className="px-6 py-3 rounded-xl text-white font-semibold hover:shadow-lg transition-all hover:scale-105" style={{ backgroundColor: '#9B8B7E' }}>
              <Plus className="inline mr-2" size={20} />
              New Task
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 pb-4">
            {columns.map(column => (
              <div key={column.id} className="flex flex-col h-full">
                <div className="rounded-t-xl p-4 shadow-sm" style={{ backgroundColor: '#F3E6DB', borderBottom: '3px solid #9B8B7E' }}>
                  <h3 className="font-semibold flex items-center gap-2" style={{ color: '#4A3F39' }}>
                    <div className="w-3 h-3 rounded-full" style={{ 
                      backgroundColor: column.id === 'todo' ? '#B89C8A' : column.id === 'in_progress' ? '#C8B8A9' : '#9B8B7E'
                    }}></div>
                    {column.title}
                    <span className="ml-auto text-sm" style={{ color: '#8A7A6D' }}>
                      {tasks.filter(t => t.progress === column.id).length}
                    </span>
                  </h3>
                </div>
                
                <div className="flex-1 rounded-b-xl p-4 space-y-3 overflow-y-auto min-h-[400px] shadow-sm" style={{ backgroundColor: '#F5EDE5' }}>
                  {tasks.filter(t => t.progress === column.id).map(task => (
                    <div key={task.id} onClick={() => { setEditingTask(task); setShowEditTask(true); }}
                      className="group p-4 rounded-xl shadow-md hover:shadow-xl cursor-pointer transition-all duration-300 hover:scale-102"
                      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E0D5CC' }}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold flex-1" style={{ color: '#4A3F39' }}>{task.task}</h4>
                        <span className="px-2 py-1 rounded-full text-xs font-medium border" style={{ 
                          backgroundColor: priorityBgColors[task.priority as keyof typeof priorityBgColors],
                          borderColor: '#DDD0C4',
                          color: '#5C4E45'
                        }}>{task.priority}</span>
                      </div>
                      <p className="text-sm mb-3 line-clamp-2" style={{ color: '#6B5B4F' }}>{task.description}</p>
                      {task.assignedTo && task.assignedTo.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {task.assignedTo.slice(0, 3).map(user => (
                              user.photo_url ? (
                                <img key={user.id} src={user.photo_url} className="w-7 h-7 rounded-full border-2 border-white" alt="" />
                              ) : (
                                <div key={user.id} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-semibold" style={{ backgroundColor: '#A69282' }}>
                                  {user.firstName[0]}
                                </div>
                              )
                            ))}
                          </div>
                          {task.assignedTo.length > 3 && <span className="text-xs" style={{ color: '#8A7A6D' }}>+{task.assignedTo.length - 3}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showCreateTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scaleIn" style={{ backgroundColor: '#F5EDE5' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold" style={{ color: '#4A3F39' }}>Create Task</h3>
              <button onClick={() => setShowCreateTask(false)} className="p-2 rounded-full"><X size={20} style={{ color: '#6B5B4F' }} /></button>
            </div>
            <div className="space-y-4">
              <InputField value={newTask.task} onChange={(e: any) => setNewTask({ ...newTask, task: e.target.value })} placeholder="Task name" />
              <InputField value={newTask.description} onChange={(e: any) => setNewTask({ ...newTask, description: e.target.value })} placeholder="Description" multiline />
              <select className="w-full p-3 border-2 rounded-xl outline-none" style={{ borderColor: '#DDD0C4', backgroundColor: '#FFFFFF', color: '#4A3F39' }}
                value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#6B5B4F' }}>Assign to</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {users.map(user => (
                    <label key={user.id} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer">
                      <input type="checkbox" className="w-4 h-4" style={{ accentColor: '#9B8B7E' }}
                        checked={newTask.user_id.includes(user.id)}
                        onChange={e => {
                          if (e.target.checked) setNewTask({ ...newTask, user_id: [...newTask.user_id, user.id] });
                          else setNewTask({ ...newTask, user_id: newTask.user_id.filter(id => id !== user.id) });
                        }}
                      />
                      <span className="text-sm" style={{ color: '#4A3F39' }}>{user.firstName} {user.lastName}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreateTask(false)} className="flex-1 px-4 py-3 border-2 rounded-xl font-medium" style={{ borderColor: '#DDD0C4', color: '#6B5B4F' }}>Cancel</button>
              <button onClick={createTask} className="flex-1 px-4 py-3 text-white rounded-xl font-medium" style={{ backgroundColor: '#9B8B7E' }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {showEditTask && editingTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scaleIn" style={{ backgroundColor: '#F5EDE5' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold" style={{ color: '#4A3F39' }}>Edit Task</h3>
              <button onClick={() => setShowEditTask(false)} className="p-2 rounded-full"><X size={20} style={{ color: '#6B5B4F' }} /></button>
            </div>
            <div className="space-y-4">
              <InputField value={editingTask.task} onChange={(e: any) => setEditingTask({ ...editingTask, task: e.target.value })} placeholder="Task name" />
              <InputField value={editingTask.description} onChange={(e: any) => setEditingTask({ ...editingTask, description: e.target.value })} placeholder="Description" multiline />
              <select className="w-full p-3 border-2 rounded-xl outline-none" style={{ borderColor: '#DDD0C4', backgroundColor: '#FFFFFF', color: '#4A3F39' }}
                value={editingTask.priority} onChange={e => setEditingTask({ ...editingTask, priority: e.target.value })}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
              <select className="w-full p-3 border-2 rounded-xl outline-none" style={{ borderColor: '#DDD0C4', backgroundColor: '#FFFFFF', color: '#4A3F39' }}
                value={editingTask.progress} onChange={e => setEditingTask({ ...editingTask, progress: e.target.value })}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#6B5B4F' }}>Assign to</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {users.map(user => (
                    <label key={user.id} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer">
                      <input type="checkbox" className="w-4 h-4" style={{ accentColor: '#9B8B7E' }}
                        checked={editingTask.assignedTo.some(u => u.id === user.id)}
                        onChange={e => {
                          if (e.target.checked) setEditingTask({ ...editingTask, assignedTo: [...editingTask.assignedTo, user] });
                          else setEditingTask({ ...editingTask, assignedTo: editingTask.assignedTo.filter(u => u.id !== user.id) });
                        }}
                      />
                      <span className="text-sm" style={{ color: '#4A3F39' }}>{user.firstName} {user.lastName}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => deleteTask(editingTask.id)} className="px-4 py-3 text-white rounded-xl font-medium" style={{ backgroundColor: '#B89C8A' }}>
                <Trash2 size={18} className="inline mr-2" />Delete
              </button>
              <button onClick={updateTask} className="flex-1 px-4 py-3 text-white rounded-xl font-medium" style={{ backgroundColor: '#9B8B7E' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showAddUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scaleIn" style={{ backgroundColor: '#F5EDE5' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold" style={{ color: '#4A3F39' }}>Add Team Member</h3>
              <button onClick={() => setShowAddUser(false)} className="p-2 rounded-full"><X size={20} style={{ color: '#6B5B4F' }} /></button>
            </div>
            <InputField value={newUserEmail} onChange={(e: any) => setNewUserEmail(e.target.value)} placeholder="user@example.com" />
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddUser(false)} className="flex-1 px-4 py-3 border-2 rounded-xl font-medium" style={{ borderColor: '#DDD0C4', color: '#6B5B4F' }}>Cancel</button>
              <button onClick={addUserToTeam} className="flex-1 px-4 py-3 text-white rounded-xl font-medium" style={{ backgroundColor: '#9B8B7E' }}>Add User</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
        .hover\\:scale-102:hover { transform: scale(1.02); }
      `}</style>
    </div>
  );
}