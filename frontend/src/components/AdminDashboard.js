import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Define the backend URL
const API_BASE_URL = 'http://localhost:8080';

// SVG Icons
const LightModeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" fill="#00bcd4" />
    <path d="M12 1V3" stroke="#00bcd4" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 21V23" stroke="#00bcd4" strokeWidth="2" strokeLinecap="round" />
    <path d="M23 12H21" stroke="#00bcd4" strokeWidth="2" strokeLinecap="round" />
    <path d="M3 12H1" stroke="#00bcd4" strokeWidth="2" strokeLinecap="round" />
    <path d="M19.7778 4.22266L18.3636 5.63687" stroke="#00bcd4" strokeWidth="2" strokeLinecap="round" />
    <path d="M5.63604 18.3638L4.22183 19.778" stroke="#00bcd4" strokeWidth="2" strokeLinecap="round" />
    <path d="M19.7778 19.7783L18.3636 18.3641" stroke="#00bcd4" strokeWidth="2" strokeLinecap="round" />
    <path d="M5.63604 5.63715L4.22183 4.22294" stroke="#00bcd4" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const DarkModeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#F9A825" stroke="#F9A825" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TaskIcon = ({ isDarkMode }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 11L12 14L22 4" stroke={isDarkMode ? "#00bcd4" : "#38A169"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke={isDarkMode ? "#00bcd4" : "#38A169"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const StepIcon = ({ isDarkMode }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 6H21" stroke={isDarkMode ? "#00bcd4" : "#38A169"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 12H21" stroke={isDarkMode ? "#00bcd4" : "#38A169"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 18H21" stroke={isDarkMode ? "#00bcd4" : "#38A169"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 6H3.01" stroke={isDarkMode ? "#00bcd4" : "#38A169"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 12H3.01" stroke={isDarkMode ? "#00bcd4" : "#38A169"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 18H3.01" stroke={isDarkMode ? "#00bcd4" : "#38A169"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DatabaseIcon = ({ isDarkMode }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 5C21 6.65685 16.9706 8 12 8C7.02944 8 3 6.65685 3 5M21 5C21 3.34315 16.9706 2 12 2C7.02944 2 3 3.34315 3 5M21 5V19C21 20.66 17 22 12 22C7 22 3 20.66 3 19V5M21 12C21 13.66 17 15 12 15C7 15 3 13.66 3 12" stroke={isDarkMode ? "#00bcd4" : "#38A169"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function AdminDashboard({ isDarkMode }) {
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(isDarkMode);
  const [activityData, setActivityData] = useState(null);
  const [timeRange, setTimeRange] = useState('week');

  // Sync darkMode with isDarkMode prop
  useEffect(() => {
    setDarkMode(isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch database stats
        const statsResponse = await axios.get(`${API_BASE_URL}/admin/database/stats`);
        setStats(statsResponse.data);

        // Fetch tasks
        const tasksResponse = await axios.get(`${API_BASE_URL}/admin/database`);
        setTasks(tasksResponse.data.tasks || []);

        // Generate activity data based on tasks
        generateActivityData(tasksResponse.data.tasks || [], timeRange);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setError('Failed to load admin data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange, darkMode]);

  // Generate activity data for charts based on tasks
  const generateActivityData = (tasks, range) => {
    // Always generate chart data, even if there are no tasks
    const tasksArray = tasks || [];

    // Sort tasks by creation date
    const sortedTasks = [...tasksArray].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    // Determine date range
    const now = new Date();
    let startDate;
    let dateFormat;
    let labelFormat;

    switch (range) {
      case 'day':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        dateFormat = (date) => `${date.getHours()}:00`;
        labelFormat = 'hourly';
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setDate(1);
        dateFormat = (date) => `${date.getDate()}/${date.getMonth() + 1}`;
        labelFormat = 'daily';
        break;
      case 'week':
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        dateFormat = (date) => {
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          return days[date.getDay()];
        };
        labelFormat = 'daily';
    }

    // Create data structure based on time range
    let labels = [];
    let taskCounts = [];
    let stepCounts = [];
    let completedCounts = [];
    let failedCounts = [];

    if (labelFormat === 'hourly') {
      // For hourly data (day view)
      for (let i = 0; i < 24; i++) {
        const hourDate = new Date(startDate);
        hourDate.setHours(i);
        labels.push(dateFormat(hourDate));

        const hourTasks = sortedTasks.filter(task => {
          const taskDate = new Date(task.created_at);
          return taskDate.getDate() === now.getDate() &&
            taskDate.getMonth() === now.getMonth() &&
            taskDate.getFullYear() === now.getFullYear() &&
            taskDate.getHours() === i;
        });

        taskCounts.push(hourTasks.length);
        stepCounts.push(hourTasks.reduce((sum, task) => sum + (task.step_count || 0), 0));
        completedCounts.push(hourTasks.filter(task => task.status === 'completed' || task.status?.includes('completed')).length);
        failedCounts.push(hourTasks.filter(task => task.status === 'failed' || task.status?.includes('failed')).length);
      }
    } else if (range === 'week') {
      // For daily data (week view)
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + i);
        labels.push(dateFormat(dayDate));

        const dayTasks = sortedTasks.filter(task => {
          const taskDate = new Date(task.created_at);
          return taskDate.getDate() === dayDate.getDate() &&
            taskDate.getMonth() === dayDate.getMonth() &&
            taskDate.getFullYear() === dayDate.getFullYear();
        });

        taskCounts.push(dayTasks.length);
        stepCounts.push(dayTasks.reduce((sum, task) => sum + (task.step_count || 0), 0));
        completedCounts.push(dayTasks.filter(task => task.status === 'completed' || task.status?.includes('completed')).length);
        failedCounts.push(dayTasks.filter(task => task.status === 'failed' || task.status?.includes('failed')).length);
      }
    } else if (range === 'month') {
      // For daily data (month view)
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const dayDate = new Date(now.getFullYear(), now.getMonth(), i);
        labels.push(dateFormat(dayDate));

        const dayTasks = sortedTasks.filter(task => {
          const taskDate = new Date(task.created_at);
          return taskDate.getDate() === i &&
            taskDate.getMonth() === now.getMonth() &&
            taskDate.getFullYear() === now.getFullYear();
        });

        taskCounts.push(dayTasks.length);
        stepCounts.push(dayTasks.reduce((sum, task) => sum + (task.step_count || 0), 0));
        completedCounts.push(dayTasks.filter(task => task.status === 'completed' || task.status?.includes('completed')).length);
        failedCounts.push(dayTasks.filter(task => task.status === 'failed' || task.status?.includes('failed')).length);
      }
    }

    // Create chart data objects
    const activityChartData = {
      labels,
      datasets: [
        {
          label: 'Tasks',
          data: taskCounts,
          borderColor: darkMode ? '#00bcd4' : '#38A169',
          backgroundColor: darkMode ? 'rgba(0, 188, 212, 0.1)' : 'rgba(56, 161, 105, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: darkMode ? '#00bcd4' : '#38A169',
          pointBorderColor: darkMode ? '#00bcd4' : '#38A169',
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Steps',
          data: stepCounts,
          borderColor: darkMode ? '#f48fb1' : '#ED64A6',
          backgroundColor: 'transparent',
          tension: 0.4,
          borderDash: [5, 5],
          pointBackgroundColor: darkMode ? '#f48fb1' : '#ED64A6',
          pointBorderColor: darkMode ? '#f48fb1' : '#ED64A6',
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      ]
    };

    // Status distribution data for bar chart
    const statusChartData = {
      labels,
      datasets: [
        {
          label: 'Completed',
          data: completedCounts,
          backgroundColor: darkMode ? 'rgba(0, 188, 212, 0.7)' : 'rgba(56, 161, 105, 0.7)',
          borderRadius: 4,
        },
        {
          label: 'Failed',
          data: failedCounts,
          backgroundColor: darkMode ? 'rgba(244, 67, 54, 0.7)' : 'rgba(229, 62, 62, 0.7)',
          borderRadius: 4,
        }
      ]
    };

    // Calculate totals for pie chart
    const totalTasks = tasksArray.length;
    const completedTasks = tasksArray.filter(task => task.status === 'completed' || task.status?.includes('completed')).length;
    const failedTasks = tasksArray.filter(task => task.status === 'failed' || task.status?.includes('failed')).length;
    const runningTasks = tasksArray.filter(task => task.status === 'running' || task.status?.includes('running')).length;
    const otherTasks = totalTasks - completedTasks - failedTasks - runningTasks;

    // Pie chart data
    const pieChartData = {
      labels: ['Completed', 'Failed', 'Running', 'Other'],
      datasets: [
        {
          data: [completedTasks, failedTasks, runningTasks, otherTasks],
          backgroundColor: [
            darkMode ? 'rgba(0, 188, 212, 0.7)' : 'rgba(56, 161, 105, 0.7)',
            darkMode ? 'rgba(244, 67, 54, 0.7)' : 'rgba(229, 62, 62, 0.7)',
            darkMode ? 'rgba(255, 193, 7, 0.7)' : 'rgba(236, 201, 75, 0.7)',
            darkMode ? 'rgba(158, 158, 158, 0.7)' : 'rgba(160, 174, 192, 0.7)'
          ],
          borderColor: darkMode ? '#1E1E2E' : '#FFFFFF',
          borderWidth: 2,
        }
      ]
    };

    setActivityData({
      activityChartData,
      statusChartData,
      pieChartData
    });
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await axios.delete(`${API_BASE_URL}/admin/database/task/${taskId}`);
        // Remove the task from the list
        setTasks(tasks.filter(task => task.id !== taskId));
        // Refresh stats
        const statsResponse = await axios.get(`${API_BASE_URL}/admin/database/stats`);
        setStats(statsResponse.data);
        // Regenerate activity data
        generateActivityData(tasks.filter(task => task.id !== taskId), timeRange);
      } catch (err) {
        console.error('Error deleting task:', err);
        alert('Failed to delete task. Please try again.');
      }
    }
  };

  const handleClearDatabase = async () => {
    if (window.confirm('Are you sure you want to delete ALL tasks? This cannot be undone.')) {
      try {
        await axios.delete(`${API_BASE_URL}/admin/database/clear?confirm=true`);
        // Clear the tasks list
        setTasks([]);
        // Refresh stats
        const statsResponse = await axios.get(`${API_BASE_URL}/admin/database/stats`);
        setStats(statsResponse.data);
        // Clear activity data
        setActivityData(null);
        alert('Database cleared successfully.');
      } catch (err) {
        console.error('Error clearing database:', err);
        alert('Failed to clear database. Please try again.');
      }
    }
  };

  // Toggle theme function - now just for local state
  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
  };

  // Chart options
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: darkMode ? '#CDD6F4' : '#2D3748',
          font: {
            family: "'Inter', sans-serif",
            size: 12
          },
          boxWidth: 15,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: darkMode ? 'rgba(30, 30, 46, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        titleColor: darkMode ? '#CDD6F4' : '#2D3748',
        bodyColor: darkMode ? '#CDD6F4' : '#2D3748',
        borderColor: darkMode ? '#45475A' : '#E2E8F0',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          family: "'Inter', sans-serif",
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          family: "'Inter', sans-serif",
          size: 13
        },
        displayColors: true,
        usePointStyle: true,
        boxWidth: 8
      }
    },
    scales: {
      x: {
        grid: {
          color: darkMode ? 'rgba(205, 214, 244, 0.1)' : 'rgba(226, 232, 240, 0.6)',
          drawBorder: false
        },
        ticks: {
          color: darkMode ? '#A6ADC8' : '#4A5568',
          font: {
            family: "'Inter', sans-serif",
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: darkMode ? 'rgba(205, 214, 244, 0.1)' : 'rgba(226, 232, 240, 0.6)',
          drawBorder: false
        },
        ticks: {
          color: darkMode ? '#A6ADC8' : '#4A5568',
          font: {
            family: "'Inter', sans-serif",
            size: 11
          },
          stepSize: 1
        },
        beginAtZero: true
      }
    },
    elements: {
      line: {
        borderWidth: 2
      },
      point: {
        borderWidth: 2,
        hoverBorderWidth: 3
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    },
    animations: {
      tension: {
        duration: 1000,
        easing: 'easeInOutCubic',
        from: 0.8,
        to: 0.4,
        loop: false
      }
    }
  };

  const barChartOptions = {
    ...lineChartOptions,
    scales: {
      ...lineChartOptions.scales,
      x: {
        ...lineChartOptions.scales.x,
        stacked: false
      },
      y: {
        ...lineChartOptions.scales.y,
        stacked: false
      }
    }
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: darkMode ? '#CDD6F4' : '#2D3748',
          font: {
            family: "'Inter', sans-serif",
            size: 12
          },
          boxWidth: 15,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: darkMode ? 'rgba(30, 30, 46, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        titleColor: darkMode ? '#CDD6F4' : '#2D3748',
        bodyColor: darkMode ? '#CDD6F4' : '#2D3748',
        borderColor: darkMode ? '#45475A' : '#E2E8F0',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          family: "'Inter', sans-serif",
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          family: "'Inter', sans-serif",
          size: 13
        },
        displayColors: true,
        usePointStyle: true,
        boxWidth: 8
      }
    },
    cutout: '70%',
    animation: {
      animateScale: true,
      animateRotate: true
    }
  };

  if (loading) return <div className="admin-loading">Loading admin data...</div>;

  return (
    <div className={`admin-dashboard ${darkMode ? 'dark-mode' : ''}`}>
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <button className="admin-theme-toggle" onClick={toggleTheme}>
          {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>
      <div className="admin-container">
        {error && <div className="admin-error">{error}</div>}

        {stats && (
          <>
            <div className="dashboard-overview">
              <div className="stat-card-container">
                <div className="stat-card">
                  <div className="stat-icon">
                    <TaskIcon isDarkMode={darkMode} />
                  </div>
                  <div className="stat-content">
                    <h3>Tasks</h3>
                    <div className="stat-value">{stats.task_count}</div>
                    <div className="stat-label">Total tasks in database</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <StepIcon isDarkMode={darkMode} />
                  </div>
                  <div className="stat-content">
                    <h3>Steps</h3>
                    <div className="stat-value">{stats.step_count}</div>
                    <div className="stat-label">Total execution steps</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <DatabaseIcon isDarkMode={darkMode} />
                  </div>
                  <div className="stat-content">
                    <h3>Database Size</h3>
                    <div className="stat-value">{stats.database_size_mb} MB</div>
                    <div className="stat-label">Current storage usage</div>
                  </div>
                </div>
              </div>
            </div>

            {activityData ? (
              <div className="dashboard-charts">
                <div className="chart-container">
                  <div className="chart-header">
                    <h2>Task Activity</h2>
                    <div className="chart-controls">
                      <button
                        className={`chart-control-btn ${timeRange === 'day' ? 'active' : ''}`}
                        onClick={() => setTimeRange('day')}
                      >
                        Day
                      </button>
                      <button
                        className={`chart-control-btn ${timeRange === 'week' ? 'active' : ''}`}
                        onClick={() => setTimeRange('week')}
                      >
                        Week
                      </button>
                      <button
                        className={`chart-control-btn ${timeRange === 'month' ? 'active' : ''}`}
                        onClick={() => setTimeRange('month')}
                      >
                        Month
                      </button>
                    </div>
                  </div>
                  <div className="chart-content">
                    <Line data={activityData.activityChartData} options={lineChartOptions} />
                  </div>
                </div>

                <div className="charts-row">
                  <div className="chart-container half">
                    <div className="chart-header">
                      <h2>Status Distribution</h2>
                    </div>
                    <div className="chart-content">
                      <Bar data={activityData.statusChartData} options={barChartOptions} />
                    </div>
                  </div>
                  <div className="chart-container half">
                    <div className="chart-header">
                      <h2>Task Status</h2>
                    </div>
                    <div className="chart-content">
                      <Doughnut data={activityData.pieChartData} options={doughnutChartOptions} />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="dashboard-charts">
                <div className="chart-container">
                  <div className="chart-header">
                    <h2>Task Activity</h2>
                  </div>
                  <div className="chart-content">
                    <p style={{ textAlign: 'center', color: 'var(--admin-text-color)', opacity: 0.7 }}>
                      No data available for charts
                    </p>
                  </div>
                </div>
              </div>
            )}

            {stats.status_counts && Object.keys(stats.status_counts).length > 0 && (
              <div className="status-distribution">
                <h2>Status Distribution</h2>
                <div className="stats-container">
                  {Object.entries(stats.status_counts).map(([status, count]) => (
                    <div className="stat-card" key={status}>
                      <h3>{status}</h3>
                      <div className="stat-value">{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.step_type_counts && Object.keys(stats.step_type_counts).length > 0 && (
              <div className="step-types">
                <h2>Step Types</h2>
                <div className="stats-container">
                  {Object.entries(stats.step_type_counts).map(([type, count]) => (
                    <div className="stat-card" key={type}>
                      <h3>{type}</h3>
                      <div className="stat-value">{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="admin-actions">
          <h2>Actions</h2>
          <button className="admin-btn danger" onClick={handleClearDatabase}>
            Clear Database
          </button>
        </div>

        <div className="tasks-section">
          <h2>Tasks ({tasks.length})</h2>
          <div className="tasks-container">
            {tasks.length === 0 ? (
              <p>No tasks found in the database.</p>
            ) : (
              <table className="tasks-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Project</th>
                    <th>Created At</th>
                    <th>Status</th>
                    <th>Steps</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(task => (
                    <tr key={task.id}>
                      <td>{task.id}</td>
                      <td>{task.project_name}</td>
                      <td>{new Date(task.created_at).toLocaleString()}</td>
                      <td className={`status-${task.status?.includes('completed') ? 'completed' : task.status?.includes('failed') ? 'failed' : task.status?.includes('running') ? 'running' : 'other'}`}>
                        {task.status}
                      </td>
                      <td>{task.step_count}</td>
                      <td>
                        <button
                          className="admin-btn small"
                          onClick={() => window.open(`${API_BASE_URL}/admin/database/task/${task.id}`, '_blank')}
                        >
                          View
                        </button>
                        <button
                          className="admin-btn small danger"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;

