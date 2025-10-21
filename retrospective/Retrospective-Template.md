TEMPLATE FOR RETROSPECTIVE (Team ##)
=====================================

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES 

### Macro statistics

- Number of stories committed vs. done 
- Total points committed vs. done 
- Nr of hours planned vs. spent (as a team)

**Remember**a story is done ONLY if it fits the Definition of Done:
 
- Unit Tests passing
- Code review completed
- Code present on VCS
- End-to-End tests performed

> Please refine your DoD if required (you cannot remove items!) 

### Detailed statistics

| Story            | # Tasks | Points     | Hours est.   | Hours actual |
|------------------|---------|------------|--------------|--------------|
| _Uncategorized_  |    4    |     /      |  3d 1h 30m   |      3d 1h   |
| Get Ticket       |    6    |     13     |  1d 3h 30m   |  1d 4h 40m   |
|Next Customer     |    5    |      3     |  7h          |  1d 20m      |
|Call customer     |    3    |     1      |  5h          | 6h           |

> story `Uncategorized` is for technical tasks, leave out story points (not applicable in this case)

- Hours per task average, standard deviation (estimate and actual)

|            |  Mean  |  StDev |
|------------|--------|--------|
| Estimation | 2h 43m | 3h 19m | 
| Actual     | 2h 53m | 3h 12m |

- Total estimation error ratio: sum of total hours spent / sum of total hours effort - 1

    $$\frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1 = 0.0816$$
    
- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n

    $$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_task_i}-1 \right| = 0.2512$$
  
## QUALITY MEASURES 

- Unit Testing:
  - Total hours estimated: 4h 30m
  - Total hours spent: 6h 15m
  - Nr of automated unit test cases: 57 
  - Coverage: 63%
- E2E testing:
  - Total hours estimated: 4h 30m
  - Total hours spent: 6h 10m
  - Nr of test cases: 38
- Code review 
  - Total hours estimated: 0m
  - Total hours spent: 0m


## ASSESSMENT

- What did go wrong in the sprint?
  - Underestimation of the time of test implementation (unit and e2e).
  - Coordination and the subdivision of task assignments
  - Decision of the structure of project and role inside the team
  - Poor documentation and comments
  - Balance of workload

- What caused your errors in estimation (if any)?
  - Underrated the complexity of the project

- What lessons did you learn (both positive and negative) in this sprint?
  Positive:
    - We were able to collaborate, without any issue in comunication with each other
    - Everyone of us demostrate to be able in developing software, and each of us with a different set of skills
  Negative:
    - We could have started to work on project a bit earlier
    - We could priorities tasks based on dependencies and free times of team members

- Which improvement goals set in the previous retrospective were you able to achieve?
  - This is our first retrospective
  
- Which ones you were not able to achieve? Why?
  - This is our first retrospective 

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)
  - A better estimation of the time
  - A better coordination and subdivision of task assignment
  - A better choice of the folder and code structure for the project, and follow the SOLID principles
  - More documentation and comments, both for function, classes and files

- One thing you are proud of as a Team!!
  - We get along well!