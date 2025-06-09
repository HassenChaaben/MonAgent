# Simple Tkinter Dinosaur Game

import tkinter as tk
import random
import time

# --- Game Constants ---
WINDOW_WIDTH = 800
WINDOW_HEIGHT = 400
GROUND_HEIGHT = 50
DINOSAUR_SIZE = 40
OBSTACLE_WIDTH = 20
OBSTACLE_HEIGHT = 40
JUMP_STRENGTH = 10
GRAVITY = 0.5
GAME_SPEED = 5 # pixels per frame
FPS = 30
MIN_OBSTACLE_DISTANCE = 250 # Minimum distance between obstacles

# --- Game Variables ---
dinosaur_y = WINDOW_HEIGHT - GROUND_HEIGHT - DINOSAUR_SIZE
dinosaur_velocity_y = 0
is_jumping = False
obstacles = []
game_running = True
score = 0
score_display = None # Canvas text object for score
frame_count = 0
SCORE_UPDATE_INTERVAL = 10
after_id = None

# --- Set up the window and canvas ---
root = tk.Tk()
root.title("Dino Game")
canvas = tk.Canvas(root, width=WINDOW_WIDTH, height=WINDOW_HEIGHT, bg='lightblue')
canvas.pack()

# --- Draw Game Elements ---
ground = canvas.create_rectangle(
    0, WINDOW_HEIGHT - GROUND_HEIGHT,
    WINDOW_WIDTH, WINDOW_HEIGHT,
    fill='brown'
)
dinosaur = canvas.create_rectangle(
    50, dinosaur_y,
    50 + DINOSAUR_SIZE, dinosaur_y + DINOSAUR_SIZE,
    fill='green'
    )

score_display = canvas.create_text(
        WINDOW_WIDTH - 50, 20, # Position near top right
        text=f'Score: {score}',
        font=('Arial', 16), fill='black', anchor='ne'
    )

# --- Game Functions ---
def jump(event):
    global is_jumping, dinosaur_velocity_y
    if not is_jumping:
        is_jumping = True
        dinosaur_velocity_y = -JUMP_STRENGTH

def create_obstacle():
    x = WINDOW_WIDTH
    y = WINDOW_HEIGHT - GROUND_HEIGHT - OBSTACLE_HEIGHT
    obstacle = canvas.create_rectangle(
        x, y,
        x + OBSTACLE_WIDTH, y + OBSTACLE_HEIGHT,
        fill='red'
    )
    obstacles.append(obstacle)

def move_obstacles():
    for obstacle in obstacles:
        canvas.move(obstacle, -GAME_SPEED, 0)
    # Remove off-screen obstacles
    if obstacles and canvas.coords(obstacles[0])[2] < 0:
        canvas.delete(obstacles.pop(0))

def apply_gravity():
    global dinosaur_y, dinosaur_velocity_y, is_jumping
    dinosaur_velocity_y += GRAVITY
    dinosaur_y += dinosaur_velocity_y

    # Prevent falling through the ground
    if dinosaur_y > WINDOW_HEIGHT - GROUND_HEIGHT - DINOSAUR_SIZE:
        dinosaur_y = WINDOW_HEIGHT - GROUND_HEIGHT - DINOSAUR_SIZE
        is_jumping = False
        dinosaur_velocity_y = 0

    canvas.coords(
        dinosaur,
        50, dinosaur_y,
        50 + DINOSAUR_SIZE, dinosaur_y + DINOSAUR_SIZE
    )

def check_collision():
    dino_coords = canvas.coords(dinosaur)
    for obstacle in obstacles:
        obstacle_coords = canvas.coords(obstacle)
        # Simple AABB collision detection
        if (dino_coords[0] < obstacle_coords[2] and
            dino_coords[2] > obstacle_coords[0] and
            dino_coords[1] < obstacle_coords[3] and
            dino_coords[3] > obstacle_coords[1]):
            print("Game Over!")
            stop_game()
            return True
    return False

def stop_game():
    global game_running
    game_running = False
    # Display a simple game over message (optional)
    canvas.create_text(
        WINDOW_WIDTH // 2, WINDOW_HEIGHT // 2,
        text="Game Over! Press 'r' to Restart or close window to Exit",
        font=('Arial', 20), fill='black'
    )
    root.unbind('<space>') # Unbind jump
    global after_id
    if after_id:
        root.after_cancel(after_id)
        after_id = None
    root.bind('r', restart_game) # Bind restart

def restart_game(event):
    global dinosaur_y, dinosaur_velocity_y, is_jumping, obstacles, game_running, score
    # Reset variables
    dinosaur_y = WINDOW_HEIGHT - GROUND_HEIGHT - DINOSAUR_SIZE
    dinosaur_velocity_y = 0
    is_jumping = False
    obstacles = []
    game_running = True
    score = 0

    # Clear canvas and redraw initial elements
    canvas.delete('all')
    ground = canvas.create_rectangle(
        0, WINDOW_HEIGHT - GROUND_HEIGHT,
        WINDOW_WIDTH, WINDOW_HEIGHT,
        fill='brown'
    )
    dinosaur = canvas.create_rectangle(
        50, dinosaur_y,
        50 + DINOSAUR_SIZE, dinosaur_y + DINOSAUR_SIZE,
        fill='green'
    )
    global score_display
    score_display = canvas.create_text(
        WINDOW_WIDTH - 50, 20, # Position near top right
        text=f'Score: {score}',
        font=('Arial', 16), fill='black', anchor='ne'
    )

    # Rebind controls and start game loop again
    root.bind('<space>', jump)
    root.unbind('r') # Unbind restart
    global after_id
    after_id = root.after(1000 // FPS, game_loop) # Call game_loop again after a delay

def game_loop():
    if game_running:
        move_obstacles()
        apply_gravity()
        check_collision()

        # Create new obstacles with minimum distance
        global score
        score += 1
        canvas.itemconfig(score_display, text=f'Score: {score}')
        if not obstacles or canvas.coords(obstacles[-1])[2] < WINDOW_WIDTH - MIN_OBSTACLE_DISTANCE:
             create_obstacle()

        global after_id
        after_id = root.after(1000 // FPS, game_loop) # Call game_loop again after a delay

# --- Event Bindings ---
root.bind('<space>', jump)

# --- Start the game loop and Tkinter main loop ---
game_loop()
root.mainloop()
