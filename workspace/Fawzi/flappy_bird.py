import pygame
import sys
import random

# Initialize Pygame
pygame.mixer.pre_init(frequency=44100, size=16, channels=1, buffer=512)
pygame.init()

# Screen dimensions
screen_width = 500
screen_height = 700
screen = pygame.display.set_mode((screen_width, screen_height))
pygame.display.set_caption('Flappy Bird')

# Game variables
gravity = 0.5
bird_movement = 0
bird_x = 100
bird_y = screen_height // 2 # Start in the middle vertically
game_active = True # Game state
score = 0 # Initialize score
font = pygame.font.Font(None, 36) # Font for displaying score

# Load graphics (replace with your image paths)
bird_surface = pygame.image.load('assets/redbird.png').convert_alpha()
bird_rect = bird_surface.get_rect(center = (bird_x, bird_y))

pipe_surface = pygame.image.load('assets/pipe-green.png').convert()
pipe_color = (0, 128, 0) # Green (fallback color if image fails)

background_surface = pygame.image.load('assets/background-day.png').convert()
background_surface = pygame.transform.scale(background_surface, (screen_width, screen_height))

# Load sounds (replace with your sound paths)
flap_sound = pygame.mixer.Sound('assets/audio/wing.ogg')
hit_sound = pygame.mixer.Sound('assets/audio/hit.ogg')
score_sound = pygame.mixer.Sound('assets/audio/point.ogg')

# Pipe variables
pipe_width = 50
pipe_gap = 200
pipe_speed = 5
pipe_list = []
PIPE_SPAWN_EVENT = pygame.USEREVENT + 1
pygame.time.set_timer(PIPE_SPAWN_EVENT, 1200) # Generate a new pipe every 1200ms
passed_pipe = [] # To track pipes that have been passed for scoring

# Game loop
clock = pygame.time.Clock()
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_SPACE: # Check for space in any state
                if game_active:
                    bird_movement = 0 # Reset vertical movement on jump
                    bird_movement -= 10 # Apply upward jump force
                    flap_sound.play() # Play flap sound
                else: # If game is not active, restart
                    game_active = True
                    pipe_list = [] # Clear pipes
                    passed_pipe = [] # Clear passed pipes
                    bird_rect.center = (bird_x, screen_height // 2) # Reset bird position
                    bird_movement = 0 # Reset bird movement
                    score = 0 # Reset score


        if event.type == PIPE_SPAWN_EVENT and game_active:
            # Generate random pipe height
            random_pipe_height = random.choice(range(100, screen_height - pipe_gap - 100))
            bottom_pipe = pipe_surface.get_rect(topleft = (screen_width, random_pipe_height + pipe_gap))
            top_pipe = pipe_surface.get_rect(bottomleft = (screen_width, random_pipe_height))
            pipe_list.extend([bottom_pipe, top_pipe])

    if game_active:
        # Apply gravity
        bird_movement += gravity
        bird_rect.centery += int(bird_movement)

        # Move pipes
        for pipe in pipe_list:
            pipe.x -= pipe_speed

        # Remove off-screen pipes
        pipe_list = [pipe for pipe in pipe_list if pipe.right > 0]

        # Check for collisions with pipes
        for pipe in pipe_list:
            if bird_rect.colliderect(pipe):
hit_sound.play() # Play hit sound
                game_active = False

        # Check for collision with top or bottom screen edges
        if bird_rect.top <= 0 or bird_rect.bottom >= screen_height: # Check against screen edges for game over
hit_sound.play() # Play hit sound
             game_active = False

        # Check for scoring
        for pipe in pipe_list:
            # Check if the bird has passed the pipe and the pipe hasn't been scored yet
            if bird_rect.left > pipe.right and pipe not in passed_pipe:
                 if pipe.bottom == screen_height or pipe.top == 0: # Score when passing either top or bottom pipe
                    score += 0.5 # Increment score by 0.5 for each pipe of the pair
                    passed_pipe.append(pipe) # Mark this pipe as passed
                    if pipe.bottom == screen_height: # Play sound only once per pipe pair (when passing bottom pipe)
                        score_sound.play()

    # Draw background
    screen.blit(background_surface, (0,0))

    if game_active:
        # Draw the bird
        screen.blit(bird_surface, bird_rect)

        # Draw pipes
        for pipe in pipe_list:
            if pipe.bottom == screen_height: # Draw bottom pipe
                screen.blit(pipe_surface, pipe)
            else: # Draw top pipe (flipped)
                fliped_pipe = pygame.transform.flip(pipe_surface, False, True)
                screen.blit(fliped_pipe, pipe)

        # Display score
        score_surface = font.render(str(int(score)), True, (255, 255, 255))
        score_rect = score_surface.get_rect(center=(screen_width // 2, 50))
        screen.blit(score_surface, score_rect)
    else:
        # Display Game Over
        game_over_surface = font.render('Game Over', True, (255, 255, 255))
        game_over_rect = game_over_surface.get_rect(center=(screen_width // 2, screen_height // 2))
        screen.blit(game_over_surface, game_over_rect)

        # Display Restart Instruction
        restart_surface = font.render('Press Space to Restart', True, (255, 255, 255))
        restart_rect = restart_surface.get_rect(center=(screen_width // 2, screen_height // 2 + 50))
        screen.blit(restart_surface, restart_rect)


    # Update the display
    pygame.display.flip()

    # Cap the frame rate
    clock.tick(60) # 60 frames per second

# Quit Pygame
pygame.quit()
sys.exit()
