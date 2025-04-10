'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useState, useEffect } from 'react';
// Remove individual icon imports and use React icons instead
import { FiPlus, FiCheck, FiCircle, FiClock, FiX, FiCalendar, FiList, FiSun, FiMoon } from 'react-icons/fi';

interface Task {
  id: number;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Record<string, Task[]>>({
    '12:00 AM - 10:00 AM': [],
    '10:00 AM - 12:00 PM': [],
    '12:00 PM - 3:00 PM': [],
    '3:00 PM - 5:00 PM': [],
    '5:00 PM - 8:00 PM': [],
  });

  const [newTask, setNewTask] = useState<string>('');
  const [currentSlot, setCurrentSlot] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Initialize local storage
  useEffect(() => {
    const savedTasks = localStorage.getItem('calendarTasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
    
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  // Save to local storage when tasks change
  useEffect(() => {
    localStorage.setItem('calendarTasks', JSON.stringify(tasks));
  }, [tasks]);

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleAddTask = () => {
    if (!newTask || !currentSlot) return;

    const newTaskObj = {
      id: Date.now(),
      title: newTask,
      completed: false,
      priority: selectedPriority,
      createdAt: new Date().toISOString(),
    };

    setTasks((prev) => ({
      ...prev,
      [currentSlot]: [...prev[currentSlot], newTaskObj],
    }));

    setNewTask('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  };

  const toggleTaskCompletion = (slot: string, taskId: number) => {
    setTasks((prev) => ({
      ...prev,
      [slot]: prev[slot].map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ),
    }));
  };

  const deleteTask = (slot: string, taskId: number) => {
    setTasks((prev) => ({
      ...prev,
      [slot]: prev[slot].filter((task) => task.id !== taskId),
    }));
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

  // Generate events for the calendar
  const getCalendarEvents = () => {
    const events: any[] = [];
    Object.entries(tasks).forEach(([timeSlot, taskList]) => {
      taskList.forEach(task => {
        // Parse the time slot to get approximate start and end times
        const [startTime, endTime] = timeSlot.split(' - ');
        
        // Create an event for each task
        events.push({
          title: task.title,
          start: `${selectedDate}T${getTimeForCalendar(startTime)}`,
          end: `${selectedDate}T${getTimeForCalendar(endTime)}`,
          backgroundColor: task.completed ? '#4ade80' : getPriorityBackgroundColor(task.priority),
          borderColor: task.completed ? '#4ade80' : getPriorityBackgroundColor(task.priority),
          textColor: '#ffffff',
          extendedProps: {
            taskId: task.id,
            timeSlot: timeSlot,
            completed: task.completed
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
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#3b82f6';
    }
  };

  return (
    <div className={`flex min-h-screen text-black ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50'} transition-colors duration-300`}>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className={`p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm flex justify-between items-center`}>
          <div className="flex items-center">
            <FiCalendar className="w-6 h-6 mr-2" />
            <h1 className="text-xl font-bold">Modern Task Calendar</h1>
          </div>
          <div className="flex items-center space-x-4">
         {/*    <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`rounded-full p-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              {darkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
            </button> */}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
            >
              <FiList className="w-5 h-5" />
              {sidebarOpen ? 'Hide Tasks' : 'Show Tasks'}
            </button>
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
        <div className={`flex-1 p-4 ${darkMode ? 'text-black fc-dark-theme' : ''}`}>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            initialView="timeGridDay"
            selectable={true}
            editable={true}
            height="100%"
            events={getCalendarEvents()}
            dateClick={(info) => {
              setSelectedDate(info.dateStr.split('T')[0]);
              // Extract the time and set current slot
              const clickedHour = new Date(info.dateStr).getHours();
              
              // Find the appropriate time slot
              const matchingSlot = Object.keys(tasks).find(slot => {
                const [startStr, endStr] = slot.split(' - ');
                const startHour = convertTimeStrToHour(startStr);
                const endHour = convertTimeStrToHour(endStr);
                return clickedHour >= startHour && clickedHour < endHour;
              });
              
              if (matchingSlot) {
                setCurrentSlot(matchingSlot);
              }
            }}
            eventClick={(info) => {
              const { taskId, timeSlot } = info.event.extendedProps;
              if (taskId && timeSlot) {
                toggleTaskCompletion(timeSlot, taskId);
              }
            }}
          />
        </div>
      </div>

      {/* Task Sidebar */}
      {sidebarOpen && (
        <div className={`w-96 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-4 shadow-lg border-l transition-all duration-300`}>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FiClock className="w-5 h-5 mr-2" />
            Tasks for {new Date(selectedDate).toLocaleDateString()}
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
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleTaskCompletion(timeSlot, task.id)}
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
                          </div>
                          <button
                            onClick={() => deleteTask(timeSlot, task.id)}
                            className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-500' : 'hover:bg-gray-200'}`}
                          >
                            <FiX className="w-4 h-4 text-gray-500" />
                          </button>
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
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={newTask}
                          onChange={(e) => setNewTask(e.target.value)}
                          onKeyPress={handleKeyPress}
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
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to convert time string to hour number
function convertTimeStrToHour(timeStr: string): number {
  const [hourStr, minuteStr] = timeStr.split(':');
  let hour = parseInt(hourStr);
  
  // Handle AM/PM format
  if (minuteStr && minuteStr.includes('PM') && hour < 12) {
    hour += 12;
  } else if (minuteStr && minuteStr.includes('AM') && hour === 12) {
    hour = 0;
  }
  
  return hour;
}