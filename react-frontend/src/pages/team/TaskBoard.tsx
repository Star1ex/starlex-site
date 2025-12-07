import React, { useEffect, useState } from "react";
import { apiFetch } from "@/app/api/api.js";
import { useParams } from "react-router-dom";

type Task = {
  id: string;
  task: string;
  description: string;
  assignedTo: string[];
  progress: string;
  priority: string;
};

type User = {
  id: string;
  firstName: string;
  lastName: string;
  role?: string;
  photo_url?: string;
};

export const TaskBoard: React.FC = () => {
  const { id: teamId } = useParams<{ id: string }>();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [newTask, setNewTask] = useState({
    task: "",
    description: "",
    priority: "Medium",
    user_id: [] as string[],  
  });

  const [selected, setSelected] = useState<Task | null>(null);

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    if (!teamId) return;

    async function load() {
      setLoading(true);

      const tasksData = await apiFetch(`/api/team/${teamId}/tasks`);
      const teamData: any = await apiFetch(`/api/team/${teamId}`);

      setTasks(tasksData);

      setUsers(Array.isArray(teamData) ? teamData : teamData.users);

      setLoading(false);
    }

    load();
  }, [teamId]);

  /* ---------------- CREATE TASK ---------------- */
  async function createTask() {
    const body = {
      ...newTask, 
      user_id: newTask.user_id ?? [], 
      progress: "todo", 
    };

    const created = await apiFetch(`/api/team/${teamId}/tasks`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    setTasks(prev => [...prev, created]);

    setShowCreate(false);
    setNewTask({
      task: "",
      description: "",
      priority: "Medium",
      user_id: [],
    });
  }

  /* ---------------- DELETE TASK ---------------- */
  async function deleteTask(id: string) {
    await apiFetch(`/api/team/${teamId}/tasks/${id}`, { method: "DELETE" });

    setTasks(prev => prev.filter(t => t.id !== id));
    setSelected(null);
  }

  if (loading) return <div>Loading...</div>;


  return (
    <div className="flex h-screen bg-[#F2E4DB] text-[#855646]">

      {/* ---------------- LEFT USERS PANEL ---------------- */}
      <div className="w-64 p-6 border-r border-[#E3CFC6]">
        <h3 className="uppercase tracking-wide text-sm mb-4 text-[#A07463]">Users</h3>

        <div className="space-y-3">
          {users.map(u => (
            <div
              key={u.id}
              className="flex items-center space-x-3 py-1 px-2 rounded hover:bg-[#ECD5CC]"
            >
              {u.photo_url ? (
                <img src={u.photo_url} className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 bg-[#D8BEB3] rounded-full" />
              )}
              <div>
                <p className="font-medium">{u.firstName} {u.lastName}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- CENTER TASK BOARD ---------------- */}
      <div className="flex-1 p-10">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Tasks</h2>

          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-1 rounded border border-[#A07463] hover:bg-[#EBD2C9]"
          >
            + New Task
          </button>
        </div>

        {/* TASK LIST */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {tasks.map(t => (
            <div
              key={t.id}
              onClick={() => setSelected(t)}
              className="p-4 bg-white shadow rounded cursor-pointer hover:shadow-lg border border-[#EDD7CD]"
            >
              <p className="font-semibold text-lg">{t.task}</p>
              <p className="text-sm text-gray-500">{t.priority}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- RIGHT ROLE PANEL ---------------- */}
      <div className="w-64 p-6 border-l border-[#E3CFC6]">
        <h3 className="uppercase tracking-wide text-sm mb-4 text-[#A07463]">Roles</h3>

        <div className="space-y-3">
          {users.map(u => (
            <div key={u.id} className="flex justify-between py-1 px-2 rounded hover:bg-[#ECD5CC]">
              <span>{u.firstName}</span>
              <span className="font-medium">{u.role || "Member"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- CREATE TASK MODAL ---------------- */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-96">

            <h3 className="text-lg font-semibold mb-4">Create Task</h3>

            <input
              className="border w-full p-2 mb-3"
              placeholder="Task name"
              value={newTask.task}
              onChange={e => setNewTask({ ...newTask, task: e.target.value })}
            />

            <textarea
              className="border w-full p-2 mb-3"
              placeholder="Description"
              value={newTask.description}
              onChange={e =>
                setNewTask({ ...newTask, description: e.target.value })
              }
            />

            <select
              className="border w-full p-2 mb-4"
              value={newTask.priority}
              onChange={e =>
                setNewTask({ ...newTask, priority: e.target.value })
              }
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="px-3 py-1 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={createTask}
                className="px-3 py-1 bg-[#A07463] text-white rounded"
              >
                Create
              </button>
            </div>
          </div>  
        </div>
      )}

      {/* ---------------- TASK DETAILS MODAL ---------------- */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-96 relative">

            <button
              className="absolute right-3 top-3"
              onClick={() => setSelected(null)}
            >
              ✕
            </button>

            <h2 className="font-bold text-lg mb-3">{selected.task}</h2>
            <p className="text-sm mb-4">{selected.description}</p>

            <div className="flex gap-3">
              <button className="px-3 py-1 bg-[#A07463] text-white rounded">
                Edit
              </button>

              <button
                onClick={() => deleteTask(selected.id)}
                className="px-3 py-1 bg-red-500 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
