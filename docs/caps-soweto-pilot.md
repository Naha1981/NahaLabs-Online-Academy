# NahaLabs Online Academy — CAPS / Soweto Pilot

## Purpose

This fork of OpenMAIC is the experimental classroom engine for a small learner pilot in Soweto. The first goal is to validate learning outcomes and classroom engagement before building a larger product layer.

## Pilot principles

- Start with 10–30 learners.
- Prioritize Grade 8–12 Mathematics and Physical Sciences first.
- Keep the OpenMAIC interactive classroom capabilities intact: AI teacher, AI classmates, whiteboard, interactive HTML, simulations, quizzes and project-based activities.
- Add South African CAPS context through structured curriculum metadata and lesson requirements rather than hard-coding curriculum claims into the core engine.
- Optimize the experience for Android/mobile and lower-bandwidth connections.
- Do not collect unnecessary learner personal information.
- Treat generated educational content as assistive: teachers remain the authority for curriculum correctness.

## First learner journey

1. Select grade.
2. Select subject.
3. Select topic/term.
4. Choose a learning goal.
5. Generate an interactive classroom.
6. Learn with the AI teacher and AI classmates.
7. Complete an embedded activity/quiz.
8. Capture lightweight progress signals.
9. Ask the learner for feedback.

## Initial subjects

### Mathematics

- Algebra
- Functions and graphs
- Geometry
- Trigonometry
- Probability and statistics

### Physical Sciences

- Mechanics
- Waves and sound
- Electricity and circuits
- Matter and materials
- Chemical reactions

## Safety and privacy

For a school/minor pilot, use access control and avoid exposing provider API keys to the browser. Do not enable public learner-to-learner communication by default. Obtain the appropriate school/parent/guardian permissions before collecting identifiable learner data.

## Success criteria

The pilot succeeds if learners can independently start a lesson, understand the interactive classroom controls, complete activities, and voluntarily return for another lesson. Secondary signals are completion rate, quiz improvement, useful simulation interactions, and teacher feedback.

## Architecture direction

OpenMAIC remains the interactive classroom engine. NahaLabs adds a thin education layer around it:

- CAPS curriculum catalog
- learner onboarding
- lesson templates
- local examples/context
- teacher/admin controls
- lightweight progress model
- pilot analytics

The education layer should remain separable so upstream OpenMAIC updates can be merged safely.
