# Flappy Bird Game
import pygame

# Initialize Pygame
pygame.init()

# Game Variables
screen_width = 800
screen_height = 600
game_over = False

# Create the screen
screen = pygame.display.set_mode((screen_width, screen_height))
pygame.display.set_caption("Flappy Bird")

# Bird Class
class Bird(pygame.sprite.Sprite):
    def __init__(self, x, y):
        pygame.sprite.Sprite.__init__(self)
        self.image = pygame.image.load("https://via.placeholder.com/30") # Placeholder image
        self.rect = self.image.get_rect()
        self.rect.center = [x, y]

    def update(self):
        # Simple movement for now
        self.rect.y += 1

# Bird Group
bird_group = pygame.sprite.Group()
bird = Bird(100, screen_height // 2)
bird_group.add(bird)

# Game Loop
run = True
clock = pygame.time.Clock()
while run:

    # Event Handler
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            run = False

    # Update Game State
    bird_group.update()

    # Draw Everything
    screen.fill((0, 0, 0))
    bird_group.draw(screen)

    # Update the Display
    pygame.display.update()
    clock.tick(60)

pygame.quit()