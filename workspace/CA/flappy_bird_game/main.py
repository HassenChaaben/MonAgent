
import pygame
import sys
import random

# Initialize Pygame
pygame.init()

# Screen dimensions
screen_width = 576
screen_height = 1024
screen = pygame.display.set_mode((screen_width, screen_height))
pygame.display.set_caption('Flappy Bird')

# Clock for controlling frame rate
clock = pygame.time.Clock()

# Font for score display
game_font = pygame.font.Font(None, 40)

# Game variables
gravity = 0.25
bird_movement = 0
bird_rect = pygame.Rect(100, 512, 34, 24) # Approximate bird size
game_active = True # Game state
score = 0
high_score = 0

# Pipe variables
pipe_width = 50
pipe_gap = 200
pipe_speed = 5
pipe_list = []
SPAWNPIPE = pygame.USEREVENT
pygame.time.set_timer(SPAWNPIPE, 1200) # Generate a new pipe every 1.2 seconds
pipe_heights = [400, 600, 800]

# Ground variables
ground_height = 150
ground_rect = pygame.Rect(0, screen_height - ground_height, screen_width, ground_height)


# Function to create pipes
def create_pipe():
    random_pipe_pos = random.choice(pipe_heights)
    bottom_pipe = pygame.Rect(screen_width, random_pipe_pos, pipe_width, screen_height - random_pipe_pos)
    top_pipe = pygame.Rect(screen_width, 0, pipe_width, random_pipe_pos - pipe_gap)
    return bottom_pipe, top_pipe

# Function to move pipes
def move_pipes(pipes):
    for pipe in pipes:
        pipe.centerx -= pipe_speed
    return pipes

# Function to draw pipes
def draw_pipes(pipes):
    for pipe in pipes:
        pygame.draw.rect(screen, (0, 128, 0), pipe) # Green color

# Function for collision detection
def check_collision(pipes):
    for pipe in pipes:
        if bird_rect.colliderect(pipe):
            return False
    if bird_rect.colliderect(ground_rect) or bird_rect.top <= -100: # Check if bird hits ground or top
        return False
    return True

# Function to display score
def display_score(game_state):
    if game_state == 'main_game':
        score_surface = game_font.render(str(int(score)), True, (255, 255, 255)) # White color
        score_rect = score_surface.get_rect(center = (screen_width // 2, 100))
        screen.blit(score_surface, score_rect)
    if game_state == 'game_over':
        score_surface = game_font.render(f'Score: {int(score)}', True, (255, 255, 255))
        score_rect = score_surface.get_rect(center = (screen_width // 2, screen_height // 2 - 50))
        screen.blit(score_surface, score_rect)

        high_score_surface = game_font.render(f'High Score: {int(high_score)}', True, (255, 255, 255))
        high_score_rect = high_score_surface.get_rect(center = (screen_width // 2, screen_height // 2 + 50))
        screen.blit(high_score_surface, high_score_rect)

# Function to update high score
def update_high_score(current_score, current_high_score):
    if current_score > current_high_score:
        current_high_score = current_high_score
    return current_high_score

# Game loop
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_SPACE and game_active:
                bird_movement = 0
                bird_movement -= 10 # Increased jump strength slightly
            if event.key == pygame.K_SPACE and not game_active:
                game_active = True
                pipe_list.clear()
                bird_rect.center = (100, 512)
                bird_movement = 0
                score = 0

        if event.type == SPAWNPIPE:
            pipe_list.extend(create_pipe())

    # Drawing the background
    screen.fill((78, 192, 202)) # Sky blue color

    if game_active:
        # Apply gravity to bird
        bird_movement += gravity
        bird_rect.centery += bird_movement

        # Check for collisions
        game_active = check_collision(pipe_list)

        # Move and draw pipes
        pipe_list = move_pipes(pipe_list)
        draw_pipes(pipe_list)

        # Update and display score
        score += 0.01 # Increment score gradually
        display_score('main_game')
    else:
        high_score = update_high_score(score, high_score)
        display_score('game_over')

    # Drawing the bird
    pygame.draw.rect(screen, (255, 255, 0), bird_rect) # Yellow color

    # Drawing the ground
    pygame.draw.rect(screen, (222, 210, 95), ground_rect) # Brownish color

    pygame.display.update()
    clock.tick(120) # Control frame rate

pygame.quit()
sys.exit()
