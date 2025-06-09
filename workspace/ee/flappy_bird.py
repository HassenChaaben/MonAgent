# flappy_bird.py

import tkinter as tk
import random

class FlappyBirdGame:
    def __init__(self, master):
        self.master = master
        master.title("Flappy Bird")

        self.canvas_width = 400
        self.canvas_height = 600
        self.canvas = tk.Canvas(master, width=self.canvas_width, height=self.canvas_height, bg="skyblue")
        self.canvas.pack()

        self.bird_x = 50
        self.bird_y = 300
        self.bird_radius = 15
        self.bird_velocity = 0
        self.gravity = 0.6
        self.flap_strength = -15

        self.pipe_width = 70
        self.pipe_gap = 200
        self.pipe_speed = 3
        self.pipes = []

        self.score = 0
        self.score_label = self.canvas.create_text(100, 50, text="Score: 0", font=("Arial", 20), fill="white")

        self.game_over = False
        self.game_started = False

        self.bird = self.canvas.create_oval(self.bird_x - self.bird_radius, self.bird_y - self.bird_radius,
                                            self.bird_x + self.bird_radius, self.bird_y + self.bird_radius,
                                            fill="yellow")

        self.start_screen()

    def start_screen(self):
        self.canvas.create_text(self.canvas_width/2, self.canvas_height/2, text="Flappy Bird", font=("Arial", 40), fill="white")
        self.canvas.create_text(self.canvas_width/2, self.canvas_height/2 + 50, text="Press <Space> to Start", font=("Arial", 20), fill="white")
        self.master.bind("<space>", self.start_game)

    def start_game(self, event):
        self.game_started = True
        self.master.unbind("<space>")
        self.master.bind("<space>", self.flap)
        self.canvas.delete("all") # Clear the start screen
        self.bird = self.canvas.create_oval(self.bird_x - self.bird_radius, self.bird_y - self.bird_radius,
                                            self.bird_x + self.bird_radius, self.bird_y + self.bird_radius,
                                            fill="yellow")
        self.pipes = []
        self.score = 0
        self.score_label = self.canvas.create_text(100, 50, text="Score: 0", font=("Arial", 20), fill="white")
        self.generate_pipe()
        self.game_loop()

    def flap(self, event):
        if self.game_started:
            self.bird_velocity = self.flap_strength

    def generate_pipe(self):
        pipe_height = random.randint(100, 400)
        bottom_pipe_height = self.canvas_height - pipe_height - self.pipe_gap

        top_pipe = self.canvas.create_rectangle(self.canvas_width, 0,
                                                self.canvas_width + self.pipe_width, pipe_height,
                                                fill="green", outline="green")
        bottom_pipe = self.canvas.create_rectangle(self.canvas_width, pipe_height + self.pipe_gap,
                                                   self.canvas_width + self.pipe_width, pipe_height + self.pipe_gap + bottom_pipe_height,
                                                   fill="green", outline="green")

        self.pipes.append((top_pipe, bottom_pipe))

    def move_pipes(self):
        if self.game_started:
            for i, (top_pipe, bottom_pipe) in enumerate(self.pipes):
                self.canvas.move(top_pipe, -self.pipe_speed, 0)
                self.canvas.move(bottom_pipe, -self.pipe_speed, 0)

                # Delete pipes that are off-screen
                if self.canvas.coords(top_pipe)[2] < 0:
                    self.canvas.delete(top_pipe)
                    self.canvas.delete(bottom_pipe)
                    self.pipes.pop(i)
                    self.score += 1
                    self.canvas.itemconfig(self.score_label, text=f"Score: {self.score}")
                    return # Avoid index out of range error after deleting

            # Generate new pipes
            if len(self.pipes) < 2:
                self.generate_pipe()

    def move_bird(self):
        if self.game_started:
            self.bird_velocity += self.gravity
            self.bird_y += self.bird_velocity
            self.canvas.move(self.bird, 0, self.bird_velocity)

    def check_collisions(self):
        if self.game_started:
            # Check for collisions with pipes
            for top_pipe, bottom_pipe in self.pipes:
                top_pipe_coords = self.canvas.coords(top_pipe)
                bottom_pipe_coords = self.canvas.coords(bottom_pipe)

                if self.bird_x + self.bird_radius > top_pipe_coords[0] and self.bird_x - self.bird_radius < top_pipe_coords[2]:
                    if self.bird_y - self.bird_radius < top_pipe_coords[3] or self.bird_y + self.bird_radius > bottom_pipe_coords[1]:
                        self.game_over = True
                        self.end_game()

            # Check for collisions with ground or sky
            if self.bird_y + self.bird_radius > self.canvas_height or self.bird_y - self.bird_radius < 0:
                self.game_over = True
                self.end_game()

    def game_loop(self):
        if not self.game_over and self.game_started:
            self.move_bird()
            self.move_pipes()
            self.check_collisions()
            self.master.after(30, self.game_loop)  # Adjust speed here

    def end_game(self):
         self.canvas.delete("all")
         self.canvas.create_text(self.canvas_width/2, self.canvas_height/2, text="Game Over!", font=("Arial", 30), fill="red")
         self.canvas.create_text(self.canvas_width/2, self.canvas_height/2 + 50, text=f"Your Score: {self.score}", font=("Arial", 20), fill="white")
         self.canvas.create_text(self.canvas_width/2, self.canvas_height/2 + 100, text="Press <Space> to Restart", font=("Arial", 20), fill="white")
         self.master.bind("<space>", self.start_game)


