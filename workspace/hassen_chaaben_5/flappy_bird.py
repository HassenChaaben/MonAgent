import pygame
import sys

# Initialize Pygame
pygame.init()
print("Pygame initialized.")

# Screen dimensions
screen_width = 288
screen_height = 512


# Bird properties
bird_x = 50
bird_y = screen_height // 2
bird_velocity = 0
gravity = 0.25
jump_strength = -6 # Negative velocity for upward movement

# Pipe properties
pipe_width = 50
pipe_gap = 150
pipe_speed = 3

# List to store pipes
pipes = []
pipe_spawn_event = pygame.USEREVENT
pygame.time.set_timer(pipe_spawn_event, 1200) # Spawn pipes every 1.2 seconds



import random

def create_pipe():
    random_pipe_pos = random.choice([-200, -100, 0])
    bottom_pipe = pygame.Rect(screen_width + 10, screen_height / 2 + random_pipe_pos + pipe_gap / 2, pipe_width, screen_height / 2 - random_pipe_pos - pipe_gap / 2)
    top_pipe = pygame.Rect(screen_width + 10, 0, pipe_width, screen_height / 2 + random_pipe_pos - pipe_gap / 2)
    return bottom_pipe, top_pipe

def move_pipes(pipes):
    for pipe in pipes:
        pipe.centerx -= pipe_speed
    return pipes

def draw_pipes(pipes):
    for pipe in pipes:
        if pipe.bottom >= screen_height:
            pygame.draw.rect(screen, (0, 255, 0), pipe) # Draw bottom pipe
        else:
            pygame.draw.rect(screen, (0, 255, 0), pipe) # Draw top pipe


# Create the game window
screen = pygame.display.set_mode((screen_width, screen_height))
pygame.display.set_caption('Flappy Bird')
print(f"Game window created with dimensions: {screen_width}x{screen_height}")

# Game loop
running = True
clock = pygame.time.Clock() # Add a clock for frame rate control

while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_SPACE:
                bird_velocity = jump_strength # Apply jump velocity

    # Apply gravity
    bird_velocity += gravity
    bird_y += bird_velocity

    # Keep bird on screen (basic boundary check for now)
    if bird_y > screen_height - 15: # Adjust boundary for circle radius
        bird_y = screen_height - 15
        bird_velocity = 0
    if bird_y < 15: # Adjust boundary for circle radius
        bird_y = 15
        bird_velocity = 0

    # Fill the background
    screen.fill((135, 206, 235))

    # Draw the bird (as a simple red circle)
    bird_radius = 15
    pygame.draw.circle(screen, (255, 0, 0), (int(bird_x), int(bird_y)), bird_radius)

    # Update the display
    pygame.display.update()

    # Cap the frame rate
    clock.tick(60) # Run at 60 frames per second

# Quit Pygame
pygame.quit()
sys.exit()