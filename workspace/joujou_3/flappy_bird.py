import pygame
import sys
import random

pygame.init()

# Window dimensions
width = 600
height = 800
screen = pygame.display.set_mode((width, height))
pygame.display.set_caption("Flappy Bird")

# Game variables
game_active = True
gravity = 0.5
bird_movement = 0
pipe_list = []
last_pipe = pygame.time.get_ticks()
pipe_frequency = 1500 # milliseconds
score = 0
font = pygame.font.Font(None, 36)

# Bird
bird_x = 100
bird_y = 400
bird_rect = pygame.Rect(bird_x, bird_y, 30, 30)

def bird_animation():
    global bird_movement
    bird_movement += gravity
    bird_rect.centery += bird_movement
    return bird_rect

def create_pipe():
    pipe_height = random.randint(200, 600)
    bottom_pipe = pygame.Rect(600, pipe_height, 50, 800)
    top_pipe = pygame.Rect(600, pipe_height - 900, 50, 800)
    return bottom_pipe, top_pipe

def move_pipes(pipes):
    for pipe in pipes:
        pipe.centerx -= 5
    return pipes

def draw_pipes(pipes):
    for pipe in pipes:
        pygame.draw.rect(screen, (0, 255, 0), pipe)

def check_collision(pipes):
    global score
    if bird_rect.top <= 0 or bird_rect.bottom >= height:
        return False
    for pipe in pipes:
        if bird_rect.colliderect(pipe):
            return False
        if pipe.centerx < bird_rect.left and not pipe.passed:
            score += 1
            pipe.passed = True
    return True

# Add a 'passed' attribute to the pipe Rect objects
pygame.Rect.passed = False

# Game loop
while True:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
            sys.exit()
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_SPACE:
                bird_movement = 0
                bird_movement -= 10

    # Draw everything
    screen.fill((0, 0, 0)) # Black background
    bird_rect = bird_animation()
    pygame.draw.rect(screen, (255, 255, 255), bird_rect)

    pipe_list = move_pipes(pipe_list)
    draw_pipes(pipe_list)

    time_now = pygame.time.get_ticks()
    if time_now - last_pipe > pipe_frequency:
        new_pipe = create_pipe()
        pipe_list.append(new_pipe)
        last_pipe = time_now

    game_active = check_collision(pipe_list)
    if game_active == False:
        print("Game Over! Score:", score)
        pygame.quit()
        sys.exit()

    score_text = font.render("Score: " + str(score), True, (255, 255, 255))
    screen.blit(score_text, (10, 10))

    # Update the display
    pygame.display.update()
