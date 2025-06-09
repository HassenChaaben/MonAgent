# flappy_bird.py

import pygame
import sys
import random
import os

# Initialize pygame
pygame.init()

# Set window dimensions
width = 800
height = 600

# Create the window
screen = pygame.display.set_mode((width, height))
pygame.display.set_caption("Flappy Bird")

# Get the directory of the script for loading images
script_dir = os.path.dirname(__file__)

# Load images
try:
    bird_img = pygame.image.load(os.path.join(script_dir, 'bird.png')).convert_alpha()
    pipe_top_img = pygame.image.load(os.path.join(script_dir, 'pipe_top.png')).convert_alpha()
    pipe_bottom_img = pygame.image.load(os.path.join(script_dir, 'pipe_bottom.png')).convert_alpha()
    background_img = pygame.image.load(os.path.join(script_dir, 'background.png')).convert()
    # Scale background to fit window
    background_img = pygame.transform.scale(background_img, (width, height))
except pygame.error as e:
    print(f"Error loading images: {e}")
    print("Make sure bird.png, pipe_top.png, pipe_bottom.png, and background.png are in the same directory as the script.")
    pygame.quit()
    sys.exit()


# Font for score and game over message
font = pygame.font.Font(None, 74)

# Bird class
class Bird:
    def __init__(self, x, y, image):
        self.image = image
        self.rect = self.image.get_rect(center=(x, y))
        self.velocity = 0
        self.gravity = 0.5
        self.jump_strength = -10

    def update(self):
        self.velocity += self.gravity
        self.rect.y += self.velocity

    def jump(self):
        self.velocity = self.jump_strength

    def draw(self, screen):
        screen.blit(self.image, self.rect)

    def reset(self, y):
        self.rect.center = (self.rect.centerx, y)
        self.velocity = 0

# Pipe class
class Pipe:
    def __init__(self, x, top_image, bottom_image, gap_size=200):
        self.top_image = top_image
        self.bottom_image = bottom_image
        self.x = x
        self.gap_size = gap_size # Size of the gap between pipes

        # Determine pipe heights based on gap and window height
        self.gap_y = random.randint(100, height - 100 - self.gap_size)
        self.top_height = self.gap_y
        self.bottom_height = height - self.gap_y - self.gap_size

        # Create rectangles for collision and drawing
        self.top_rect = self.top_image.get_rect(topleft=(x, 0))
        self.bottom_rect = self.bottom_image.get_rect(topleft=(x, self.gap_y + self.gap_size))

        self.width = self.top_rect.width # Assuming top and bottom pipe images have same width
        self.speed = 5
        self.passed = False # To track if the bird has passed this pipe

        # Scale pipe images to fit calculated heights
        self.top_image = pygame.transform.scale(self.top_image, (self.width, self.top_height))
        self.bottom_image = pygame.transform.scale(self.bottom_image, (self.width, self.bottom_height))

        # Update rectangles after scaling images
        self.top_rect = self.top_image.get_rect(topleft=(x, 0))
        self.bottom_rect = self.bottom_image.get_rect(topleft=(x, self.gap_y + self.gap_size))


    def update(self):
        self.x -= self.speed
        self.top_rect.x = self.x
        self.bottom_rect.x = self.x

    def draw(self, screen):
        screen.blit(self.top_image, self.top_rect)
        screen.blit(self.bottom_image, self.bottom_rect)


    def collides(self, bird_rect):
        # Check collision with top pipe rectangle
        if bird_rect.colliderect(self.top_rect):
            return True
        # Check collision with bottom pipe rectangle
        if bird_rect.colliderect(self.bottom_rect):
            return True
        return False

# Function to reset the game state
def restart_game():
    global bird, pipes, score, game_over, last_pipe
    bird.reset(height // 2)
    pipes.clear()
    score = 0
    game_over = False
    last_pipe = pygame.time.get_ticks()

# Create the bird instance with the loaded image
bird = Bird(100, height // 2, bird_img)

# Create the pipes list
pipes = []
pipe_frequency = 2000 # milliseconds
last_pipe = pygame.time.get_ticks() - pipe_frequency

# Game variables
game_over = False
score = 0

# Game loop
running = True
clock = pygame.time.Clock()
while running:
    # Handle events
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_SPACE:
                if not game_over:
                    bird.jump()
                else:
                    restart_game() # Restart game if space is pressed when game is over

    if not game_over:
        # Update game logic
        bird.update()

        current_time = pygame.time.get_ticks()
        if current_time - last_pipe > pipe_frequency:
            # Create new pipes with the loaded images
            pipe = Pipe(width, pipe_top_img, pipe_bottom_img)
            pipes.append(pipe)
            last_pipe = current_time

        # Move pipes, check for collisions and scoring
        pipes_to_remove = []
        for pipe in pipes:
            pipe.update()
            if pipe.x < -pipe.width:
                pipes_to_remove.append(pipe)

            # Check for scoring (bird's right edge has passed the pipe's right edge)
            if not pipe.passed and bird.rect.left > pipe.bottom_rect.right: # Use pipe.bottom_rect or pipe.top_rect, they share the same x and width
                score += 1
                pipe.passed = True


            if pipe.collides(bird.rect): # Pass the bird's rectangle for collision
                game_over = True

        for pipe in pipes_to_remove:
            pipes.remove(pipe)

        # Check for ground collision (bird's bottom edge is below the window height)
        if bird.rect.bottom > height:
            game_over = True


    # Draw everything
    screen.blit(background_img, (0, 0)) # Draw the background first

    bird.draw(screen) # Draw the bird using its draw method

    for pipe in pipes:
        pipe.draw(screen) # Draw pipes using their draw method

    # Display score
    score_text = font.render(str(score), True, (255, 255, 255))
    screen.blit(score_text, (width // 2 - score_text.get_width() // 2, 20))

    if game_over:
        # Display Game Over message
        game_over_text = font.render("Game Over", True, (255, 255, 255))
        screen.blit(game_over_text, (width // 2 - game_over_text.get_width() // 2, height // 2 - game_over_text.get_height() // 2))

        # Optionally display a restart instruction
        restart_text = font.render("Press Space to Restart", True, (255, 255, 255))
        screen.blit(restart_text, (width // 2 - restart_text.get_width() // 2, height // 2 + 50))

    pygame.display.flip()

    clock.tick(60) # Limit frame rate to 60 FPS

# Quit pygame
pygame.quit()
sys.exit()
