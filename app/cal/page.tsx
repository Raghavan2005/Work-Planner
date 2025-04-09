'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
//import { HeaderToolbarInput } from '@fullcalendar/core'; 

import { useState } from 'react';

interface Task {
  id: number;
  title: string;
  completed: boolean;
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
  const [currentSlot, setCurrentSlot] = useState<string>(''); // Track which time slot is selected

  // Add task to the selected time slot
  const handleAddTask = () => {
    if (!newTask || !currentSlot) return;

    const newTaskObj = {
      id: Date.now(),
      title: newTask,
      completed: false,
    };

    setTasks((prev) => ({
      ...prev,
      [currentSlot]: [...prev[currentSlot], newTaskObj],
    }));

    setNewTask(''); // Clear input after adding the task
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

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Calendar */}
      <div className="flex-1 p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek',
          }}
          initialView="timeGridWeek"
          selectable={true}
          editable={true}
          dateClick={(info) => setCurrentSlot(info.dateStr)} // Set the clicked slot as the current slot
          eventContent={eventInfo => (
            <div className="custom-event-style">
              {eventInfo.event.title}
            </div>
          )}
        />
      </div>

      {/* Daily Tasks */}
      <div className="w-96 bg-white p-4 shadow-lg border-l">
        <h2 className="text-xl font-semibold mb-4">Daily Tasks</h2>
        <div className="space-y-4">
          {/* Time slots (acting as headers) */}
          {Object.keys(tasks).map((timeSlot) => (
            <div key={timeSlot}>
              <h3
                onClick={() => setCurrentSlot(timeSlot)} // Set the clicked time slot as the current slot
                className="font-medium text-lg cursor-pointer time-slot-header"
              >
                {/* Time Slot Header with background color */}
                <span className="time-label">{timeSlot}</span>
              </h3>

              {/* Display tasks for each time slot */}
              {currentSlot === timeSlot && (
                <div className="space-y-2 mt-2">
                  {tasks[timeSlot].map((task) => (
                    <div key={task.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTaskCompletion(timeSlot, task.id)}
                        className="h-4 w-4"
                      />
                      <span className={task.completed ? 'line-through' : ''}>
                        {task.title}
                      </span>
                    </div>
                  ))}

                  {/* Input field to add a task under this time slot */}
                  <div className="mt-2">
                    <input
                      type="text"
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Add a task"
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
