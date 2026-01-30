# Application Refactoring Skill

This document defines the **mandatory refactoring skills, responsibilities,
and technical standards** that MUST be followed during any refactoring process,
especially when executed by LLMs such as Claude Code.

This file should be read and applied whenever possible before making any
structural or architectural changes to the codebase.

---

## 🎯 General Objective

Ensure that any refactoring:
- Preserves 100% of existing functionality
- Improves readability, maintainability, and performance
- Reduces accidental complexity
- Follows proven software engineering principles
- Is executed in a planned, incremental, and safe manner

---

## 🧠 Mandatory Refactoring Skills

### 1. Global Application Understanding
- Read and analyze the entire project structure before refactoring
- Identify main execution flows
- Understand core business rules
- Recognize critical and sensitive areas
- Map internal dependencies between modules and layers
- Distinguish between domain logic, infrastructure, and utilities

---

### 2. Technical Diagnosis
- Identify:
  - Large or overly complex files
  - Modules or classes with multiple responsibilities
  - Duplicated or redundant code
  - Excessive coupling
  - Low cohesion
  - SOLID principle violations
- Detect potential performance bottlenecks
- Assess refactoring risks

---

### 3. Refactoring Planning
Before modifying any code, MUST:
- Create a structured refactoring plan
- Break the work into:
  - Clear phases
  - Subtasks
  - Task dependencies
- Define a safe execution order
- Provide technical justification for each decision
- Identify risks and mitigation strategies

⚠️ Never refactor directly without a plan.

---

### 4. Clean Code Practices
Strictly apply:
- Small, focused functions
- Single Responsibility Principle (SRP)
- Clear, semantic, and consistent naming
- Removal of dead code
- Elimination of duplication
- Clarity over cleverness

---

### 5. File and Folder Organization
- Avoid large files
- Split files by responsibility
- Create clear and cohesive modules
- Ensure:
  - Each file has a single, well-defined purpose
  - Each folder represents a logical context
- Avoid unnecessary deep folder structures

---

### 6. Architecture and Design
- Respect SOLID principles
- Promote low coupling
- Maximize cohesion
- Isolate business logic
- Avoid circular dependencies
- Keep architecture simple and explicit

---

### 7. Performance and Efficiency
- Avoid unnecessary processing
- Reduce import and dependency overhead
- Optimize critical execution paths
- Keep the application fast and responsive
- Do not prematurely optimize without justification

---

### 8. Refactoring Safety Rules
- DO NOT remove existing functionality
- DO NOT change business rules
- DO NOT modify public contracts (APIs, interfaces, output formats)
- DO NOT introduce new dependencies without clear justification
- Preserve compatibility with the current environment

---

### 9. Incremental Execution
- Refactor in small, safe steps
- Validate each change conceptually
- Explain file and module splits
- Ensure the application remains functional at every stage

---

### 10. Communication and Transparency
Always provide:
- Initial diagnosis
- Refactoring plan
- Before-and-after structure (when applicable)
- Clear technical justifications
- Objective list of applied improvements
- Future improvement suggestions (optional)

---

## 🔁 Mandatory Usage

Whenever refactoring is requested:
1. Read this file completely
2. Follow the skills and rules described here
3. Implicitly reference this document when making decisions
4. Prioritize safety, clarity, and code quality

This document represents the **official refactoring standard of the application**.