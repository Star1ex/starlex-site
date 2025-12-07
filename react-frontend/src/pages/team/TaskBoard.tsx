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
  photo_url?: string;
};

export const TaskBoard: React.FC = () => {
  const { id: teamId } = useParams<{ id: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!teamId) return;

    async function fetchData() {
      try {
        setLoading(true);
        setError("");

        const tasksData: Task[] = await apiFetch(`/team/${teamId}/tasks`);

        const usersData: User[] | { users: User[] } = await apiFetch(`/team/${teamId}`);
        let usersArray: User[] = [];
        if (Array.isArray(usersData)) {
          usersArray = usersData;
        } else if ("users" in usersData && Array.isArray(usersData.users)) {
          usersArray = usersData.users;
        } else {
          throw new Error("Invalid users data from API");
        }

        setTasks(tasksData);
        setUsers(usersArray);
      } catch (err: any) {
        console.error(err);
        setError("Error loading tasks or users");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [teamId]);

  const handleTaskClick = (task: Task) => setSelectedTask(task);
  const handleCloseModal = () => setSelectedTask(null);

  const handleAssignUser = async (taskId: string, userId: string) => {
    try {
      await apiFetch(`/team/${teamId}/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify({ assignedToID: [userId] }),
      });
      setTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...t, assignedTo: [userId] } : t))
      );
    } catch (err) {
      console.error(err);
    }
  };

  if (!teamId) return <div>Team not found</div>;
  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="flex h-full">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 place-items-center">
        {tasks.map(task => (
          <div
            key={task.id}
            className="relative p-4 bg-white rounded shadow hover:shadow-lg cursor-pointer w-full max-w-sm"
          >
            <div onClick={() => handleTaskClick(task)}>
              <h4 className="font-semibold">{task.task}</h4>
              <p className="text-sm text-gray-500">{task.progress} / {task.priority}</p>
            </div>
            <div className="absolute top-2 right-2">
              <select
                value={task.assignedTo[0] || ""}
                onChange={e => handleAssignUser(task.id, e.target.value)}
                className="border rounded px-1 py-0.5 text-xs"
              >
                <option value="">Assign</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
      <div className="w-64 border-l p-4 bg-gray-50">
        <h3 className="text-sm font-semibold mb-2">Team Users</h3>
        <ul className="space-y-2">
          {users.map(u => (
            <li key={u.id} className="flex items-center space-x-2">
              {u.photo_url ? (
                <img src={u.photo_url} alt="" className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 bg-gray-300 rounded-full" />
              )}
              <span>{u.firstName} {u.lastName}</span>
            </li>
          ))}
        </ul>
      </div>

      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-96 relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-2 right-2 text-gray-500"
            >
              X
            </button>
            <h2 className="font-bold text-lg mb-2">{selectedTask.task}</h2>
            <p className="mb-4">{selectedTask.description}</p>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded"
              onClick={() => console.log("Edit task", selectedTask.id)}
            >
              Edit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
