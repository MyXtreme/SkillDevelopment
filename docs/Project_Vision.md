# Project Vision and Technical Direction

This document is the current source of truth for the project. It reflects the product direction, technical architecture, and development priorities for future work.

## Project Purpose

MyXtype is evolving from a simple typing website into a skill-development platform. Typing is the first implemented experience, and future skills such as Reading and Memory are part of the long-term vision.

The goal is not only to measure typing performance, but to help users improve through meaningful practice, engaging experiences, and personalized feedback.

## Product Direction

The project is intentionally focused on building a strong foundation before expanding into larger systems.

### Current priority

The immediate goal is to create a polished and enjoyable Typing experience that feels complete enough to be genuinely useful and worth sharing.

### Guiding principles

- Ship before expanding
- Prioritize user experience over technical novelty
- Build a clean foundation for future growth
- Keep the core experience simple, focused, and intuitive

## Inspirations and Design Intent

The project is inspired by products that value clarity, speed, and user focus, especially in the areas of:

- minimalism
- immediate usability
- strong visual clarity
- customization
- educational value

The project does not aim to copy the complexity of large mature platforms. Instead, it aims to deliver a more focused and thoughtful experience.

## Technology Stack

The project is currently built with:

- React
- TypeScript
- Vite

## Architecture Philosophy

The architecture is intentionally modular and feature-oriented.

### Core principles

- Feature-based architecture
- Presentational components kept separate from domain logic
- Component styles colocated with the components they style
- Logic and hooks organized by the feature or behavior they implement
- Context API for global state
- Clear separation of responsibilities over large monolithic components

### Feature organization

Organize the Typing experience around the responsibilities users and developers work with, not only by technical kind such as components, hooks, engine, or results. Keep each presentational component focused and place its CSS module beside it. Group hooks and non-UI logic into feature-specific areas according to the behavior they implement, so a change to one behavior can be followed without navigating unrelated technical folders.

Shared components and utilities should live outside a feature only when they are genuinely reused. Avoid turning shared folders into catch-alls, and keep presentation, state coordination, and domain calculations independently understandable.

### State ownership

Application-wide state should live in shared context when it affects the whole app, such as:

- current skill
- theme
- layout mode
- global user preferences

Typing-specific state should be owned by a dedicated typing context so that typing logic remains isolated from unrelated application concerns.

UI components should remain mostly presentational. Lifecycle and effects belong in hooks; domain calculations belong in focused logic modules. Keep these pieces grouped by the typing behavior they support rather than gathering all hooks or all logic into unrelated top-level buckets.

## Typing Product Direction

The project is no longer structured around traditional labels such as Classic, Race, or Story modes.

Instead, Typing is being redesigned around user intention and experience.

### Activities

The current experience model is based on activities rather than modes. Activities define why the user is typing.

Current activity concepts include:

- Measure
- Practice
- Compete
- Explore (working name, may change later)

These activities represent the user’s intent rather than simply the content being typed.

### Activity configuration

Configurations such as:

- duration
- word count
- difficulty
- punctuation
- numbers
- uppercase

belong to the activity definition rather than defining the activity itself.

This keeps the product model flexible and makes future expansion easier.

## Typing Engine

The current typing engine is structured to support a modern, extensible typing experience.

### Current capabilities

- typing lifecycle
- session management
- timeline metrics
- summary metrics
- mistake recording
- live WPM calculation
- accuracy calculation
- feature-specific state and behavior

### Metrics and event model

Mistakes are stored as structured events rather than only being reduced to a final accuracy score. This allows the system to later support richer feedback, weakness analysis, and personalized recommendations.

Timeline metrics are recorded over time and will become the foundation for visual graphs and progress analysis.

Keep result presentation distinct from result analysis and calculations. Result views should be focused presentational components with their styles nearby, while replay, graphs, and analysis logic should be organized around the result behavior they provide.

## User Experience Philosophy

The product should feel simple, focused, and immediately understandable.

The application should not overwhelm users with too many modes or settings at the start. The default experience should make sense right away.

After a session, the product should naturally guide the user toward meaningful next actions rather than stopping at raw statistics.

Examples of follow-up actions include:

- retry
- continue
- practice weaknesses
- compete
- explore

This flow is expected to support future AI-driven personalization, but the architecture should be prepared for it even before AI is introduced.

## Current Development Priorities (Version 1)

The highest priority is to stabilize and polish the core Typing experience.

### Version 1 priorities

1. Stabilize Typing V1
2. Finish session visualization
3. Improve the results experience
4. Complete activity configuration
5. Polish UI and interactions
6. Deploy Version 1

## Scope for Version 1

The following are intentionally outside the scope of Version 1:

- AI personalization
- backend systems
- authentication
- analytics infrastructure
- cloud synchronization
- reading platform features
- memory platform features

These areas may be considered later, but only after the core typing product is stable, polished, and useful.

## Long-Term Vision

Typing is the first step in a broader skill-development platform. In the future, the product may expand to additional learning experiences such as:

- Reading skills
- Memory skills
- Structured learning flows

The long-term goal is to create a unified environment where users can develop practical cognitive and learning skills through meaningful practice.

If AI is introduced in the future, it should be used only where it meaningfully improves the learning experience rather than being added for novelty alone.
