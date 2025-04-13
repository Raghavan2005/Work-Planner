'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useState, useEffect, useRef } from 'react';
import { FiPlus, FiCheck, FiCircle, FiClock, FiX, FiCalendar, FiList, FiSun, FiMoon, FiUser, FiEdit, FiLogOut } from 'react-icons/fi';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase-config';
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from 'next/navigation';

interface Task {
  id?: string; 
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  assignee: string; 
  timeSlot: string; 
  date: string; 
}

const TEAM_MEMBERS = [
  "Unassigned",
  "Ananya",
  "Divya",
  "Kavya",
  "Meera",
  "Sowmya",
  "Sanjana"
];


export default function CalendarPage() {

  const router = useRouter();
  const auth = getAuth();
  const initialTasksState: Record<string, Task[]> = {
    '8:00 AM - 9:00 AM': [],
    '9:00 AM - 10:00 AM': [], 
    '10:00 AM - 11:00 AM': [],
    '11:00 AM - 12:00 PM': [],
    '12:00 PM - 1:00 PM': [],
    '1:00 PM - 2:00 PM': [],
    '2:00 PM - 3:00 PM': [],
  };
  
  const [tasks, setTasks] = useState<Record<string, Task[]>>(initialTasksState);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState<string>('');
  const [currentSlot, setCurrentSlot] = useState<string>('');
  const [formattedDate, setFormattedDate] = useState<string>('');

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [selectedAssignee, setSelectedAssignee] = useState<string>("Unassigned");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [newTaskDropdownOpen, setNewTaskDropdownOpen] = useState(false);
  const [taskDropdownOpen, setTaskDropdownOpen] = useState<string | null>(null);
  
  // New state for editing task
  const [editingTask, setEditingTask] = useState<{id: string, slot: string, title: string} | null>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  
  // Ref for clicking outside of dropdowns
  const profileDropdownRef = useRef(null);

 
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const tasksCollection = collection(db, 'tasks');
        const querySnapshot = await getDocs(tasksCollection);
        const fetchedTasks: Task[] = [];
        querySnapshot.forEach((doc) => {
          const taskData = doc.data() as Omit<Task, 'id'>;
          if (taskData.date === selectedDate) {
            fetchedTasks.push({ id: doc.id, ...taskData });
          }
        });

        // Group tasks by time slot
        const groupedTasks = fetchedTasks.reduce((acc, task) => {
          acc[task.timeSlot] = acc[task.timeSlot] || [];
          acc[task.timeSlot].push(task);
          return acc;
        }, { ...initialTasksState }); 

        setTasks(groupedTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [selectedDate]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close assignee dropdown
      setShowAssigneeDropdown(false);
      
      // Close profile dropdown
      if (profileDropdownRef.current && 
          !profileDropdownRef.current.contains(event.target) &&
          event.target.id !== 'profile-button') {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleAddTask = async () => {
    if (!newTask || !currentSlot) return;

    const newTaskObj: Omit<Task, 'id'> = {
      title: newTask,
      completed: false,
      priority: selectedPriority,
      createdAt: new Date().toISOString(),
      assignee: selectedAssignee,
      timeSlot: currentSlot,
      date: selectedDate,
    };

    try {
      const docRef = await addDoc(collection(db, 'tasks'), newTaskObj);
      setTasks((prev) => ({
        ...prev,
        [currentSlot]: [...(prev[currentSlot] || []), { id: docRef.id, ...newTaskObj } as Task],
      }));
      setNewTask('');
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  // Function to handle editing task
  const handleEditTask = async () => {
    if (!editingTask || !editingTask.title.trim()) return;

    try {
      const taskRef = doc(db, 'tasks', editingTask.id);
      await updateDoc(taskRef, { title: editingTask.title });
      
      setTasks((prev) => ({
        ...prev,
        [editingTask.slot]: prev[editingTask.slot].map((task) =>
          task.id === editingTask.id ? { ...task, title: editingTask.title } : task
        ),
      }));
      
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (editingTask) {
        handleEditTask();
      } else {
        handleAddTask();
      }
    }
  };

  const toggleTaskCompletion = async (slot: string, taskId: string, completed: boolean) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, { completed: !completed });
      setTasks((prev) => ({
        ...prev,
        [slot]: prev[slot].map((task) =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        ),
      }));
    } catch (error) {
      console.error('Error updating task completion:', error);
    }
  };

  const deleteTask = async (slot: string, taskId: string) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await deleteDoc(taskRef);
      setTasks((prev) => ({
        ...prev,
        [slot]: prev[slot].filter((task) => task.id !== taskId),
      }));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const updateTaskAssignee = async (slot: string, taskId: string, assignee: string) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, { assignee });
      setTasks((prev) => ({
        ...prev,
        [slot]: prev[slot].map((task) =>
          task.id === taskId ? { ...task, assignee } : task
        ),
      }));
    } catch (error) {
      console.error('Error updating task assignee:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-amber-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-blue-500';
    }
  };

  const getProgressPercentage = () => {
    const allTasks = Object.values(tasks).flat();
    if (allTasks.length === 0) return 0;

    const completedTasks = allTasks.filter(task => task.completed).length;
    return Math.round((completedTasks / allTasks.length) * 100);
  };
  
  useEffect(() => {
    const formatted = new Date(selectedDate).toLocaleDateString('en-US'); // or 'en-IN'
    setFormattedDate(formatted);
  }, [selectedDate]);
  
  // Generate events for the calendar
  const getCalendarEvents = () => {
    const events: any[] = [];
    Object.entries(tasks).forEach(([timeSlot, taskList]) => {
      taskList.forEach(task => {
        const [startTime, endTime] = timeSlot.split(' - ');

        events.push({
          id: task.id,
          title: `${task.title} ${task.assignee !== "Unassigned" ? `(${task.assignee})` : ''}`,
          start: `${selectedDate}T${getTimeForCalendar(startTime)}`,
          end: `${selectedDate}T${getTimeForCalendar(endTime)}`,
          backgroundColor: task.completed ? '#4ade80' : getPriorityBackgroundColor(task.priority),
          borderColor: task.completed ? '#4ade80' : getPriorityBackgroundColor(task.priority),
          textColor: '#ffffff',
          extendedProps: {
            taskId: task.id,
            timeSlot: timeSlot,
            completed: task.completed,
            assignee: task.assignee
          }
        });
      });
    });
    return events;
  };

  // Helper to convert time format for calendar
  const getTimeForCalendar = (timeStr: string) => {
    // Convert "12:00 AM" to "00:00:00"
    const time = new Date(`2000/01/01 ${timeStr}`);
    return time.toTimeString().split(' ')[0];
  };

  const getPriorityBackgroundColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500 text-white';
      case 'medium':
        return 'bg-amber-500 text-white';
      case 'low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const getAssigneeColor = (assignee: string) => {
    if (assignee === "Unassigned") return "text-gray-500";

    // Generate consistent colors based on name
    const colors = [
      "text-blue-500",
      "text-purple-500",
      "text-pink-500",
      "text-indigo-500",
      "text-teal-500"
    ];

    const index = TEAM_MEMBERS.indexOf(assignee) % colors.length;
    return colors[index >= 0 ? index : 0];
  };

  const getAssigneeInitial = (name: string) => {
    return name === "Unassigned" ? "U" : name.charAt(0);
  };
 
  const handleSignOut = async  () => {
   
  
    try {
      await signOut(auth);
      console.log("sdgdfg")
      router.push("/"); 
    } catch (error) {
      console.error("Error signing out:", error);
    }
    setProfileDropdownOpen(false);
  };

  return (
    <div className={`flex min-h-screen text-black ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50'} transition-colors duration-300`}>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className={`p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm flex justify-between items-center`}>
          <div className="flex items-center">
            <FiCalendar className="w-6 h-6 mr-2" />
            <h1 className="text-xl font-bold">Work Planner</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`rounded-full p-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              {darkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
            >
              <FiList className="w-5 h-5" />
              {sidebarOpen ? 'Hide Tasks' : 'Show Tasks'}
            </button>
            
            {/* Profile Button */}
            <div className="relative" onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}>
              <button
                id="profile-button"
                
                className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-100 hover:bg-blue-200'}`}
              >
                <FiUser className="w-5 h-5" />
              </button>
              
              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div 
                  ref={profileDropdownRef}
                  className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg ${
                    darkMode ? 'bg-gray-800' : 'bg-white'
                  } ring-1 ring-black ring-opacity-5 z-50`}
                >
                  <div className="py-1">
                    <button
                      onClick={handleSignOut}
                      className={`flex items-center w-full text-left px-4 py-2 text-sm ${
                        darkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <FiLogOut className="mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Progress Bar */}
        <div className={`mx-4 mt-4 mb-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-4`}>
          <div
            className="bg-blue-500 h-4 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
        <div className="text-center text-sm mb-4">
          <span className="font-medium">{getProgressPercentage()}% Complete</span> - {Object.values(tasks).flat().filter(t => t.completed).length} of {Object.values(tasks).flat().length} tasks completed
        </div>

        {/* Calendar */}
        <div className={`flex-1 text-x ${darkMode ? 'fc-dark-theme' : ''}`}>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            initialView="dayGridMonth" 
            selectable={true}
            editable={false}
            dayHeaderContent={(arg) => {
              const date = arg.date;
              const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(date);
              const day = date.getDate();
              const month = date.getMonth() + 1;
              return `${weekday} ${day}/${month}`;
            }}
               
            height="120%"
            events={getCalendarEvents()}
            dateClick={(info) => {
              const clickedDate = info.dateStr.split('T')[0];
              if (clickedDate !== selectedDate) {
                setSelectedDate(clickedDate);
                setCurrentSlot('');
              }
            }}
            eventClick={(info) => {
              const { taskId, timeSlot, completed } = info.event.extendedProps;
              if (taskId && timeSlot) {
                toggleTaskCompletion(timeSlot, taskId, completed);
              }
            }}
            eventContent={(eventInfo) => {
            
              return (
                <div
                  className={`flex items-center justify-center text-xs rounded px-1 ${
                    eventInfo.event.extendedProps.completed ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}
                  style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
                >
                  {eventInfo.event.title}
                </div>
              );
            }}
          />
        </div>
      </div>

      {/* Task Sidebar */}
      {sidebarOpen && (
        <div className={`w-96 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-4 shadow-lg border-l transition-all duration-300`}>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FiClock className="w-5 h-5 mr-2" />
            Tasks for {formattedDate}
          </h2>

          <div className="space-y-6">
            {/* Time slots */}
            {Object.keys(tasks).map((timeSlot) => (
              <div key={timeSlot} className={`rounded-lg ${currentSlot === timeSlot ? (darkMode ? 'bg-gray-700' : 'bg-blue-50') : ''} p-2`}>
                <h3
                  onClick={() => setCurrentSlot(timeSlot)}
                  className={`font-medium text-lg cursor-pointer flex items-center justify-between ${
                    currentSlot === timeSlot ? (darkMode ? 'text-blue-300' : 'text-blue-600') : ''
                  }`}
                >
                  <span>{timeSlot}</span>
                  <span className="text-sm font-normal">
                    {tasks[timeSlot].filter(t => t.completed).length}/{tasks[timeSlot].length}
                  </span>
                </h3>

                {/* Display tasks for the current time slot */}
                {currentSlot === timeSlot && (
                  <div className="space-y-2 mt-3">
                    {tasks[timeSlot].length > 0 ? (
                      tasks[timeSlot].map((task) => (
                        <div
                          key={task.id}
                          className={`flex items-center justify-between p-2 rounded-md ${
                            darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                          } ${task.completed ? (darkMode ? 'bg-gray-600/50' : 'bg-gray-100') : ''}`}
                        >
                          {editingTask && editingTask.id === task.id ? (
                            // Edit mode
                            <div className="flex items-center flex-1 mr-2">
                              <input
                                type="text"
                                value={editingTask.title}
                                onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                                onKeyDown={handleKeyPress}
                                className={`flex-1 p-1 rounded ${
                                  darkMode
                                    ? 'bg-gray-700 border-gray-600 text-white'
                                    : 'border border-gray-300'
                                }`}
                                autoFocus
                              />
                              <button
                                onClick={handleEditTask}
                                className={`ml-2 p-1 rounded ${
                                  darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                                } text-white`}
                              >
                                <FiCheck className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingTask(null)}
                                className={`ml-2 p-1 rounded ${
                                  darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-300 hover:bg-gray-400'
                                } text-white`}
                              >
                                <FiX className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            // View mode
                            <>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => toggleTaskCompletion(timeSlot, task.id!, task.completed)}
                                  className="focus:outline-none"
                                >
                                  {task.completed ? (
                                    <FiCheck className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <FiCircle className={`w-5 h-5 ${getPriorityColor(task.priority)}`} />
                                  )}
                                </button>
                                <span className={task.completed ? 'line-through text-gray-500' : ''}>
                                  {task.title}
                                </span>

                                {/* Assignee badge */}
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTaskDropdownOpen(task.id!);
                                    }}
                                    className={`w-6 h-6 flex items-center justify-center rounded-full ${getAssigneeColor(task.assignee)} bg-opacity-20 hover:bg-opacity-30 font-medium text-xs`}
                                    title={`Assigned to: ${task.assignee}`}
                                  >
                                    {getAssigneeInitial(task.assignee)}
                                  </button>

                                  {/* Assignee dropdown for this task */}
                                  {taskDropdownOpen === task.id && (
                                    <div
                                      className={`absolute z-10 mt-1 w-32 rounded-md shadow-lg ${darkMode ? 'bg-gray-700' : 'bg-white'} ring-1 ring-black ring-opacity-5`}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div className="py-1">
                                        {TEAM_MEMBERS.map((member) => (
                                          <button
                                            key={member}
                                            onClick={() => {
                                              updateTaskAssignee(timeSlot, task.id!, member);
                                              setTaskDropdownOpen(null);
                                            }}
                                            className={`block w-full text-left px-4 py-2 text-sm ${
                                              darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                                            } ${member === task.assignee ? (darkMode ? 'bg-gray-600' : 'bg-gray-100') : ''}`}
                                          >
                                            {member}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex">
                                {/* Edit button */}
                                <button
                                  onClick={() => setEditingTask({id: task.id!, slot: timeSlot, title: task.title})}
                                  className={`p-1 rounded-full mr-1 ${darkMode ? 'hover:bg-gray-500' : 'hover:bg-gray-200'}`}
                                >
                                  <FiEdit className="w-4 h-4 text-gray-500" />
                                </button>
                                
                                {/* Delete button */}
                                <button
                                  onClick={() => deleteTask(timeSlot, task.id!)}
                                  className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-500' : 'hover:bg-gray-200'}`}
                                >
                                  <FiX className="w-4 h-4 text-gray-500" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm italic">No tasks for this time slot</p>
                    )}

                    {/* Add task input */}
                    <div className="mt-3">
                      <div className="flex space-x-2 mb-2">
                        <button
                          onClick={() => setSelectedPriority('low')}
                          className={`px-2 py-1 rounded text-xs ${selectedPriority === 'low' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700'}`}
                        >
                          Low
                        </button>
                        <button
                          onClick={() => setSelectedPriority('medium')}
                          className={`px-2 py-1 rounded text-xs ${selectedPriority === 'medium' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700'}`}
                        >
                          Medium
                        </button>
                        <button
                          onClick={() => setSelectedPriority('high')}
                          className={`px-2 py-1 rounded text-xs ${selectedPriority === 'high' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700'}`}
                        >
                          High
                        </button>

                        {/* Assignee selector for new task */}
                        <div className="relative ml-auto">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewTaskDropdownOpen(!newTaskDropdownOpen);
                            }}
                            className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                              darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            <FiUser className="w-3 h-3" />
                            <span>{selectedAssignee}</span>
                          </button>

                          {/* Dropdown for new task assignee */}
                          {newTaskDropdownOpen && (   
                            <div
                              className={`absolute right-0 z-10 mt-1 w-32 rounded-md shadow-lg ${darkMode ? 'bg-gray-700' : 'bg-white'} ring-1 ring-black ring-opacity-5`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="py-1">
                                {TEAM_MEMBERS.map((member) => (
                                  <button
                                    key={member}
                                    onClick={() => {
                                      setSelectedAssignee(member);
                                      setNewTaskDropdownOpen(false);
                                    }}
                                    className={`block w-full text-left px-4 py-2 text-sm ${
                                      darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                                    } ${member === selectedAssignee ? (darkMode ? 'bg-gray-600' : 'bg-gray-100') : ''}`}
                                  >
                                    {member}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="text"
                          value={newTask}
                          onChange={(e) => setNewTask(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddTask();
                            }
                          }}
                          placeholder="Add a task"
                          className={`flex-1 p-2 rounded-l ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'border border-gray-300'
                          }`}
                        />
                        <button
                          onClick={handleAddTask}
                          disabled={!newTask}
                          className={`p-2 rounded-r ${
                            newTask
                              ? (darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600')
                              : (darkMode ? 'bg-gray-700 cursor-not-allowed' : 'bg-gray-300 cursor-not-allowed')
                          } text-white`}
                        >
                          <FiPlus className="w-5 h-5" />
                        </button>
                      </div>
                    </div></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


function convertTimeStrToHour(timeStr: string): number {
  const [hourStr, minuteStr] = timeStr.split(':');
  let hour = parseInt(hourStr);

  if (minuteStr && minuteStr.includes('PM') && hour < 12) {
    hour += 12;
  } else if (minuteStr && minuteStr.includes('AM') && hour === 12) {
    hour = 0;
  }

  return hour;
}