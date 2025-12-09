// Full updated TaskBoard component with refined warm beige/brown palette matching screenshot

import React, { useEffect, useState } from "react";
import { X, Plus, Trash2, UserPlus } from "lucide-react";

// Mock API function - replace with your actual apiFetch
const apiFetch = async (url: string, options?: any) => {
  console.log("API Call:", url, options);
  return new Promise((resolve) => setTimeout(() => resolve({}), 500));
};

// Types
export type Task = {
  id: string;
  task: string;
  description: string;
  assignedTo: User[];
  progress: string;
  priority: string;
};

export type User = {
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

  /* LOAD DATA */
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  /* CREATE TASK */
  async function createTask() {
    try {
      await apiFetch(`/api/team/${teamId}/tasks`, {
        method: "POST",
        body: JSON.stringify({
          ...newTask,
          progress: "todo",
        }),
      });

      await loadData();
      setShowCreateTask(false);
      setNewTask({ task: "", description: "", priority: "Medium", user_id: [] });
    } catch (err) {
      console.error(err);
    }
  }

  /* UPDATE TASK */
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
    } catch (err) {
      console.error(err);
    }
  }

  /* DELETE TASK */
  async function deleteTask(id: string) {
    if (!confirm("Delete task?")) return;

    try {
      await apiFetch(`/api/team/${teamId}/tasks/${id}`, { method: "DELETE" });
      setTasks(prev => prev.filter(t => t.id !== id));
      setShowEditTask(false);
    } catch (err) {
      console.error(err);
    }
  }

  /* ADD USER */
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
    } catch (err) {
      console.error(err);
    }
  }

  const priorityColors = {
    Low: "bg-[#D4C7BD] text-[#5C4E45]",
    Medium: "bg-[#C8B8A9] text-[#5C4E45]",
    High: "bg-[#B89C8A] text-[#3D2E27]",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#E8DDD3]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A69282] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E8DDD3]"> {/* warm beige background */}

      {/* MOBILE HEADER */}
      <div className="lg:hidden bg-[#F3E6DB] shadow-md p-4 flex items-center justify-between sticky top-0 z-30">
        <h1 className="text-xl font-bold text-[#5C4E45]">TaskBoard</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUserPanel(!showUserPanel)}
            className="p-2 rounded-lg bg-[#E8DDD3] text-[#5C4E45] hover:bg-[#D9C9BC] transition-colors"
          >
            <UserPlus size={20} />
          </button>
          <button
            onClick={() => setShowCreateTask(true)}
            className="p-2 rounded-lg bg-[#A69282] text-white hover:bg-[#917C6E] transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-screen lg:overflow-hidden">

        {/* USERS PANEL */}
        <div className={`${showUserPanel ? "fixed inset-0 z-40 lg:relative" : "hidden lg:block"} lg:w-72 bg-[#F7EFE7] border-r border-[#D7C8BA] overflow-y-auto`}>

          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#5C4E45]">Users</h3>
              <button onClick={() => setShowAddUser(true)} className="p-2 rounded-full bg-[#E8DDD3] hover:bg-[#D9C9BC] text-[#5C4E45] transition-all">
                <Plus size={18} />
              </button>
              <button className="lg:hidden" onClick={() => setShowUserPanel(false)}>
                <X />
              </button>
            </div>

            <div className="space-y-3">
              {users.map(user => (
                <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#E8DDD3] transition-all">
                  <div className="w-10 h-10 bg-[#A69282] text-white rounded-full flex items-center justify-center font-semibold">
                    {user.firstName[0]}
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-[#8A7A6D]">{user.role || "Member"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TASK COLUMNS */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">

          <div className="hidden lg:flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-[#5C4E45]">Tasks</h2>
            <button
              onClick={() => setShowCreateTask(true)}
              className="px-6 py-3 rounded-xl bg-[#A69282] text-white font-semibold hover:bg-[#927D6D] transition-all"
            >
              <Plus size={20} className="inline mr-1" /> New Task
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columns.map(col => (
              <div key={col.id} className="flex flex-col">
                <div className="bg-[#F3E6DB] p-4 rounded-t-xl border-b-4 border-[#A69282]">
                  <h3 className="font-medium text-[#5C4E45]">{col.title}</h3>
                </div>

                <div className="bg-[#F7EFE7] p-4 rounded-b-xl space-y-4 min-h-[400px] overflow-y-auto shadow-sm">

                  {tasks.filter(t => t.progress === col.id).map(task => (
                    <div
                      key={task.id}
                      className="bg-white border border-[#E0D5CC] p-4 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-all"
                      onClick={() => {
                        setEditingTask(task);
                        setShowEditTask(true);
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-[#4A3F39]">{task.task}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs border ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                          {task.priority}
                        </span>
                      </div>

                      <p className="text-sm text-[#6A5C53] line-clamp-2 mb-2">{task.description}</p>

                      {task.assignedTo.length > 0 && (
                        <div className="flex -space-x-2 items-center">
                          {task.assignedTo.slice(0, 3).map(u => (
                            <div key={u.id} className="w-8 h-8 rounded-full bg-[#A69282] text-white text-xs flex items-center justify-center border-2 border-white">
                              {u.firstName[0]}
                            </div>
                          ))}
                          {task.assignedTo.length > 3 && (
                            <span className="text-xs text-gray-500 ml-2">+{task.assignedTo.length - 3}</span>
                          )}
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
    </div>
  );
}