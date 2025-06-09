
import pygame
import random
import os
import os
if os.path.exists('assets'):
    current_dir = os.getcwd()
else:
    current_dir = os.path.join(os.getcwd(), 'workspace', 'oop')
asset_path = os.path.join(current_dir, 'assets')

if '__file__' in locals():
    current_dir = os.path.dirname(os.path.abspath(__file__))
else:
    current_dir = os.getcwd()
asset_path = os.path.join(current_dir, 'assets')



# Initialize pygame
pygame.init()

# Screen dimensions
screen_width = 288
screen_height = 512
screen = pygame.display.set_mode((screen_width, screen_height))
pygame.display.set_caption("Flappy Bird")
import os
current_dir = os.getcwd()
asset_path = os.path.join(current_dir, 'assets')


# Load images
bg = pygame.image.load(os.path.join(asset_path, "bg.png")).convert()
bird_img = pygame.image.load(os.path.join(asset_path, "bird.png")).convert_alpha()
pipe_img = pygame.image.load(os.path.join(asset_path, "pipe.png")).convert_alpha()

# Game variables
bird_x = 50
bird_y = screen_height // 2
bird_velocity = 0
gravity = 0.25
pipe_gap = 150
pipe_frequency = 1500  # milliseconds
last_pipe = pygame.time.get_ticks() - pipe_frequency
pipe_list = []
score = 0
font = pygame.font.Font(None, 36)
game_active = True

# Function to create a pipe
def create_pipe():
    random_pipe_pos = random.choice(range(pipe_gap, screen_height - pipe_gap))
    bottom_pipe = pipe_img.get_rect(midtop = (screen_width + 100, random_pipe_pos))
    top_pipe = pipe_img.get_rect(midbottom = (screen_width + 100, random_pipe_pos - pipe_gap))
    return bottom_pipe, top_pipe

# Function to move pipes
def move_pipes(pipes):
    for pipe in pipes:
        pipe.centerx -= 5
    return pipes

# Function to draw pipes
def draw_pipes(pipes):
    for pipe in pipes:
        if pipe.bottom >= screen_height:
            screen.blit(pipe_img, pipe)
        else:
            flip_pipe = pygame.transform.flip(pipe_img, False, True)
            screen.blit(flip_pipe, pipe)

# Function to check collision
def check_collision(pipes):
    global game_active
    bird_rect = bird_img.get_rect(center = (bird_x, int(bird_y)))
    for pipe in pipes:
        if bird_rect.colliderect(pipe):
            game_active = False
            return

    if bird_y > screen_height or bird_y < 0:
        game_active = False
        return

# Game loop
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_SPACE and game_active:
                bird_velocity = -8
            if event.key == pygame.K_SPACE and not game_active:
                game_active = True
                pipe_list.clear()
                bird_y = screen_height // 2
                bird_velocity = 0
                score = 0

    # Bird movement
    if game_active:
        bird_velocity += gravity
        bird_y += bird_velocity

    # Pipe creation
    time_now = pygame.time.get_ticks()
    if time_now - last_pipe > pipe_frequency and game_active:
        pipe_list.extend(create_pipe())
        last_pipe = time_now

    # Pipe movement
    pipe_list = move_pipes(pipe_list)

    # Collision check
    check_collision(pipe_list)

    # Draw everything
    screen.blit(bg, (0, 0))
    draw_pipes(pipe_list)
    screen.blit(bird_img, (bird_x, int(bird_y)))

    # Score
    score_text = font.render(str(score), True, (255, 255, 255))
    score_rect = score_text.get_rect(center = (screen_width // 2, 50))
    screen.blit(score_text, score_rect)

    # Update the display
    pygame.display.update()

    # Limit frame rate
    pygame.time.Clock().tick(120)

pygame.quit()
