import pg from "pg";

const { Client } = pg;

const books = [
  {
    title: "Introduction to Computer Science",
    author: "Dr. Alan Turing",
    description: "A comprehensive guide to fundamental computer science concepts, algorithms, data structures, and computer systems architecture.",
    content: `# Introduction to Computer Science

## Chapter 1: What Is Computer Science?

Computer science is the study of computation, information, and automation. It spans a range of topics from the theoretical — such as algorithms, computability, and information theory — to the practical, including the design of hardware and software. Unlike many scientific disciplines, computer science is not simply the study of computers themselves, but rather the study of the processes that interact with data and that can be represented as data in the form of programs.

At its core, computer science asks fundamental questions: What can be computed? How efficiently can it be computed? What are the limits of computation? These questions drive the development of new technologies and innovations that shape the modern world.

The field emerged in the early 20th century, rooted in the groundbreaking work of mathematicians like Kurt Gödel, Alonzo Church, and Alan Turing. Turing's concept of the universal machine — a theoretical device capable of simulating any algorithmic process — laid the foundation for modern computing and remains one of the most important ideas in the history of science.

## Chapter 2: Algorithms and Problem Solving

An algorithm is a finite, well-defined sequence of instructions designed to perform a specific task or solve a particular problem. Algorithms are the backbone of computer science; every program, application, and system depends on them. Understanding how to design, analyze, and optimize algorithms is essential for any computer scientist.

Consider the simple problem of sorting a list of numbers. There are many possible approaches: Bubble Sort repeatedly swaps adjacent elements that are out of order, Selection Sort finds the smallest element and places it first, and Merge Sort divides the list in half, sorts each half, and merges them back together. Each of these algorithms solves the same problem, but they differ dramatically in efficiency.

Bubble Sort, for instance, has a time complexity of O(n²) in the worst case, meaning the number of operations grows quadratically with the input size. Merge Sort, on the other hand, achieves O(n log n) performance, making it far more suitable for large datasets. This difference is not merely academic — when sorting millions of records, the choice of algorithm can mean the difference between seconds and hours.

Algorithm design techniques include divide-and-conquer, dynamic programming, greedy algorithms, and backtracking. Divide-and-conquer breaks a problem into smaller subproblems, solves each independently, and combines the results. Dynamic programming is similar but avoids redundant work by storing the results of subproblems. Greedy algorithms make locally optimal choices at each step, hoping to find a global optimum.

## Chapter 3: Data Structures

A data structure is a way of organizing, managing, and storing data so that it can be accessed and modified efficiently. The choice of data structure can have a profound impact on the performance of a program.

Arrays are the simplest data structure: a contiguous block of memory that stores elements of the same type. They allow constant-time access to any element by index, but inserting or deleting elements in the middle requires shifting all subsequent elements.

Linked lists solve this problem by storing each element in a separate node that contains a pointer to the next node. Insertion and deletion become constant-time operations, but random access is no longer possible — to reach the nth element, you must traverse the list from the beginning.

Trees are hierarchical data structures in which each node can have multiple children. Binary search trees (BSTs) maintain the property that the left child of any node contains a smaller value and the right child contains a larger value, enabling efficient searching, insertion, and deletion in O(log n) time on average.

Hash tables provide near-constant-time access by mapping keys to array indices through a hash function. They are used extensively in databases, caches, and programming language implementations. However, collisions — when two keys map to the same index — must be handled through techniques like chaining or open addressing.

## Chapter 4: Computer Architecture

At the lowest level, a computer is an electronic device that manipulates binary data — sequences of 0s and 1s. The central processing unit (CPU) is the brain of the computer, executing instructions stored in memory. Modern CPUs contain billions of transistors and can perform billions of operations per second.

The von Neumann architecture, proposed by mathematician John von Neumann in 1945, describes a computer with a single memory that stores both program instructions and data. The CPU fetches instructions from memory, decodes them, executes them, and writes results back to memory. This fetch-decode-execute cycle is the fundamental operation of virtually all modern computers.

Memory is organized in a hierarchy: registers are the fastest but smallest, followed by cache memory, main memory (RAM), and finally secondary storage (hard drives and SSDs). Each level is slower but larger than the one above it. Effective use of this memory hierarchy is critical for performance.

## Chapter 5: Operating Systems and Networks

An operating system (OS) is the software layer between the hardware and user applications. It manages resources such as the CPU, memory, and I/O devices, and provides services like file systems, process management, and security. Popular operating systems include Windows, macOS, Linux, Android, and iOS.

Computer networks enable communication between devices. The Internet, the largest network in existence, connects billions of devices worldwide. Data is transmitted in packets, each containing the sender's address, the recipient's address, and a portion of the message. Protocols like TCP/IP ensure that packets are delivered reliably and in the correct order.

The World Wide Web, built on top of the Internet, uses HTTP (Hypertext Transfer Protocol) to transmit web pages written in HTML. Web browsers interpret HTML and render it as the visual pages we interact with daily. Behind the scenes, web applications use server-side languages like Python, Java, and JavaScript, along with databases, to process requests and generate dynamic content.

## Chapter 6: Conclusion

Computer science is a vast and rapidly evolving field. From the theoretical foundations of computation to the practical challenges of software engineering, it touches every aspect of modern life. Whether you are designing algorithms, building systems, or analyzing data, the principles covered in this book provide the essential foundation for your journey into the world of computing.`,
    category: "Technology",
    campus: "ZDSPGC-Dimataling Campus",
    isAvailablePhysical: true,
    totalCopies: 5,
    availableCopies: 5,
    coverUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&q=80",
    publishedYear: 2021,
    isbn: "978-0131103627"
  },
  {
    title: "Principles of Modern Economics",
    author: "Jane Smith, PhD",
    description: "An in-depth study of microeconomic and macroeconomic theories, market structures, fiscal policies, and economic systems.",
    content: `# Principles of Modern Economics

## Chapter 1: The Nature of Economics

Economics is the social science that studies how individuals, businesses, governments, and nations make choices about how to allocate scarce resources to satisfy their unlimited wants. At its heart, economics is about trade-offs. Every decision involves a cost — the value of the next-best alternative that must be given up, known as the opportunity cost.

The field is traditionally divided into two branches. Microeconomics examines the behavior of individual consumers, firms, and markets. It asks questions like: How do consumers decide what to buy? How do firms determine their prices? What happens when the government imposes a tax or a price ceiling? Macroeconomics, by contrast, studies the economy as a whole, focusing on aggregate phenomena such as inflation, unemployment, economic growth, and monetary policy.

The fundamental economic problem is scarcity. Resources — land, labor, capital, and entrepreneurship — are limited, but human wants are virtually unlimited. This scarcity forces societies to make choices about what to produce, how to produce it, and for whom to produce it.

## Chapter 2: Supply, Demand, and Market Equilibrium

The law of demand states that, all else being equal, as the price of a good rises, the quantity demanded falls, and vice versa. This inverse relationship is driven by two effects: the substitution effect (consumers switch to cheaper alternatives) and the income effect (higher prices reduce consumers' purchasing power).

The law of supply states that, all else being equal, as the price of a good rises, the quantity supplied increases. Producers are willing to offer more of a product at higher prices because it becomes more profitable to do so.

Market equilibrium occurs where the supply and demand curves intersect. At this price, the quantity supplied equals the quantity demanded, and the market clears. If the price is above equilibrium, a surplus results, putting downward pressure on prices. If the price is below equilibrium, a shortage occurs, driving prices upward.

Shifts in supply or demand — caused by changes in consumer preferences, technology, input costs, or government policies — alter the equilibrium price and quantity. For example, a new technology that reduces production costs shifts the supply curve to the right, leading to a lower equilibrium price and a higher equilibrium quantity.

## Chapter 3: Market Structures

Perfect competition is a market structure characterized by many small firms selling identical products, with free entry and exit. No single firm can influence the market price; each is a price taker. In the long run, firms in a perfectly competitive market earn zero economic profit.

Monopoly is the opposite extreme: a single firm dominates the entire market. Monopolists are price makers — they can set prices above marginal cost and earn sustained economic profits. However, monopolies often lead to deadweight loss, as output is restricted below the socially optimal level. Governments may regulate monopolies or break them up through antitrust laws.

Oligopoly describes a market with a small number of large firms whose decisions are interdependent. Each firm must consider how its rivals will respond to changes in price, output, or strategy. Game theory — the study of strategic decision-making — is the primary analytical tool for understanding oligopoly behavior.

Monopolistic competition combines elements of perfect competition and monopoly. Many firms compete, but each sells a slightly differentiated product. Firms have some pricing power due to brand loyalty or product features, but competition limits their ability to earn long-run economic profits.

## Chapter 4: Macroeconomic Indicators

Gross Domestic Product (GDP) is the total market value of all final goods and services produced within a country's borders in a given period. It is the most widely used measure of economic activity. GDP can be calculated using three approaches: the expenditure approach (summing consumption, investment, government spending, and net exports), the income approach (summing wages, profits, rents, and interest), and the production approach (summing the value added at each stage of production).

The unemployment rate measures the percentage of the labor force that is jobless and actively seeking employment. Economists distinguish between several types of unemployment: frictional (short-term, between jobs), structural (mismatch between skills and job requirements), cyclical (caused by economic downturns), and seasonal.

Inflation is a sustained increase in the general price level. It is measured by the Consumer Price Index (CPI) or the GDP deflator. Moderate inflation is considered normal, but hyperinflation can devastate an economy by eroding purchasing power and creating uncertainty.

## Chapter 5: Fiscal and Monetary Policy

Fiscal policy refers to the government's use of taxation and spending to influence the economy. During a recession, expansionary fiscal policy — increased government spending or tax cuts — can stimulate demand and boost output. During periods of high inflation, contractionary fiscal policy — reduced spending or tax increases — can cool the economy.

Monetary policy is conducted by a country's central bank (such as the Bangko Sentral ng Pilipinas in the Philippines or the Federal Reserve in the United States). The central bank controls the money supply and interest rates to achieve macroeconomic objectives. Lowering interest rates encourages borrowing and spending, stimulating economic activity. Raising rates has the opposite effect.

Both fiscal and monetary policy have limitations. Fiscal policy is subject to political constraints and implementation lags. Monetary policy may be ineffective at very low interest rates (the liquidity trap) and can take time to affect the real economy.

## Chapter 6: Conclusion

Economics provides a powerful framework for understanding the world. By studying how markets work, why economies grow, and how policy decisions affect our lives, we become better-informed citizens and more effective decision-makers. The principles outlined in this book are not merely abstract theories — they are tools for analyzing real-world problems and making our communities more prosperous.`,
    category: "Reference",
    campus: "ZDSPGC-Dimataling Campus",
    isAvailablePhysical: true,
    totalCopies: 3,
    availableCopies: 2,
    coverUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=400&q=80",
    publishedYear: 2022,
    isbn: "978-0073511443"
  },
  {
    title: "College Physics & Calculus Integration",
    author: "Prof. Richard Feynman",
    description: "Connecting classical mechanics, thermodynamics, and electromagnetism with differential and integral calculus principles.",
    content: `# College Physics & Calculus Integration

## Chapter 1: The Language of Physics

Physics is the fundamental natural science that seeks to understand how the universe works, from the smallest subatomic particles to the largest structures in the cosmos. Mathematics is the language in which the laws of physics are written. Calculus, in particular, is indispensable for describing how physical quantities change over time and space.

Differential calculus deals with rates of change. If the position of an object is described by a function x(t), then its velocity v(t) is the derivative dx/dt — the rate at which position changes with respect to time. Acceleration a(t) is the derivative of velocity, or the second derivative of position: a(t) = d²x/dt².

Integral calculus is the reverse process. Given an acceleration function, we can find velocity by integrating: v(t) = ∫a(t)dt. Likewise, we can find position by integrating velocity. These relationships form the foundation for analyzing motion in physics.

## Chapter 2: Kinematics — Describing Motion

Kinematics is the branch of mechanics that describes motion without considering its causes. For motion with constant acceleration, the following kinematic equations apply:

v = v₀ + at
x = x₀ + v₀t + ½at²
v² = v₀² + 2a(x - x₀)

These equations can be derived using calculus. Starting from the definition of constant acceleration a = dv/dt, integrating both sides with respect to time gives v = v₀ + at. Integrating again gives x = x₀ + v₀t + ½at².

Projectile motion is a classic application. An object launched at an angle θ with initial speed v₀ follows a parabolic trajectory. The horizontal and vertical components of motion are independent: the horizontal velocity remains constant (ignoring air resistance), while the vertical motion is governed by gravitational acceleration g = 9.8 m/s².

The range R of a projectile launched from ground level is R = (v₀² sin 2θ) / g, which is maximized when θ = 45°.

## Chapter 3: Newton's Laws and Dynamics

Sir Isaac Newton's three laws of motion form the foundation of classical mechanics.

The First Law (Law of Inertia) states that an object at rest remains at rest, and an object in uniform motion continues in uniform motion, unless acted upon by a net external force. This law defines what a force does — it changes the state of motion.

The Second Law establishes the quantitative relationship between force, mass, and acceleration: F = ma. This deceptively simple equation is actually a differential equation. Since acceleration is the second derivative of position, Newton's Second Law can be written as F = m(d²x/dt²). Solving this differential equation for different force functions is one of the central tasks in classical mechanics.

The Third Law states that for every action, there is an equal and opposite reaction. When you push against a wall, the wall pushes back against you with the same force. These paired forces act on different objects and are fundamental to understanding interactions.

## Chapter 4: Work, Energy, and Conservation Laws

Work is defined as the integral of force along a displacement: W = ∫F · dx. When a constant force F is applied over a displacement d at angle θ, the work done is W = Fd cos θ. Work can be positive (force and displacement in the same direction), negative (opposite directions), or zero (perpendicular).

The Work-Energy Theorem states that the net work done on an object equals its change in kinetic energy: W_net = ΔKE = ½mv² - ½mv₀².

The Law of Conservation of Energy is one of the most fundamental principles in all of physics. In an isolated system, energy cannot be created or destroyed — it can only be transformed from one form to another. Potential energy (gravitational, elastic, electric) can be converted to kinetic energy and vice versa, but the total energy remains constant.

## Chapter 5: Thermodynamics

Thermodynamics is the study of heat, work, temperature, and energy transfer. The First Law of Thermodynamics is a statement of energy conservation: ΔU = Q - W, where ΔU is the change in internal energy, Q is the heat added to the system, and W is the work done by the system.

The Second Law of Thermodynamics introduces the concept of entropy — a measure of disorder or randomness in a system. In any natural process, the total entropy of an isolated system always increases. This law explains why heat flows spontaneously from hot to cold, why perpetual motion machines are impossible, and why certain processes are irreversible.

Temperature is a measure of the average kinetic energy of molecules in a substance. The Celsius, Fahrenheit, and Kelvin scales are related by: K = °C + 273.15 and °F = (9/5)°C + 32. Absolute zero (0 K, or -273.15°C) is the theoretical minimum temperature, at which molecular motion ceases.

## Chapter 6: Electromagnetism

Electric charges create electric fields that exert forces on other charges. Coulomb's Law quantifies the force between two point charges: F = kq₁q₂/r², where k = 8.99 × 10⁹ N·m²/C². Like charges repel; unlike charges attract.

The electric field E at a point in space is the force per unit charge: E = F/q. For a point charge Q, the field is E = kQ/r², directed radially outward for positive charges.

Magnetic fields are produced by moving charges (currents). A current-carrying wire creates a magnetic field that circles the wire, described by the right-hand rule. The force on a charge q moving with velocity v in a magnetic field B is F = qv × B.

Maxwell's equations unify electricity, magnetism, and optics. They show that changing electric fields create magnetic fields, and changing magnetic fields create electric fields. This interplay gives rise to electromagnetic waves — light, radio waves, X-rays — which travel at the speed of light c = 3 × 10⁸ m/s.

## Chapter 7: Conclusion

Physics and calculus are deeply intertwined. The language of derivatives and integrals allows us to precisely describe the motion of planets, the flow of heat, the behavior of electric circuits, and countless other phenomena. Mastering both subjects simultaneously gives students a powerful toolkit for understanding the natural world and solving complex engineering problems.`,
    category: "Science",
    campus: "ZDSPGC-Dimataling Campus",
    isAvailablePhysical: true,
    totalCopies: 4,
    availableCopies: 4,
    coverUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=400&q=80",
    publishedYear: 2020,
    isbn: "978-0321973610"
  },
  {
    title: "Literary Landmarks: From Shakespeare to Modernism",
    author: "William Faulkner",
    description: "A collection of literary analyses covering classic plays, romantic poetry, and modern post-war prose movements.",
    content: `# Literary Landmarks: From Shakespeare to Modernism

## Chapter 1: The Elizabethan Stage — Shakespeare and His World

William Shakespeare (1564–1616) remains the most celebrated writer in the English language. Born in Stratford-upon-Avon, he produced approximately 39 plays, 154 sonnets, and several longer poems over a career spanning roughly two decades. His works encompass comedies, tragedies, histories, and romances, each exploring the complexities of human nature with unmatched depth and eloquence.

Shakespeare's tragedies — Hamlet, Macbeth, Othello, and King Lear — probe the darkest corners of ambition, jealousy, madness, and mortality. In Hamlet, the prince of Denmark grapples with grief, betrayal, and the burden of revenge, delivering some of the most quoted lines in literary history: "To be, or not to be, that is the question." The play's exploration of indecision, moral corruption, and the nature of existence has made it a cornerstone of Western literature.

Macbeth examines the destructive power of unchecked ambition. Spurred by prophecy and his wife's ruthless encouragement, Macbeth murders King Duncan and seizes the Scottish throne, only to descend into paranoia, guilt, and tyranny. Shakespeare's portrayal of Macbeth's psychological disintegration is a masterclass in character development.

His comedies, including A Midsummer Night's Dream, Twelfth Night, and Much Ado About Nothing, celebrate love, wit, and the absurdity of human behavior. These plays often feature mistaken identities, cross-dressing heroines, and clever wordplay, culminating in joyous resolutions that affirm the power of love and community.

## Chapter 2: The Romantic Revolution

The Romantic movement, spanning roughly 1789 to 1850, was a reaction against the rationalism of the Enlightenment and the dehumanizing effects of industrialization. Romantic poets celebrated emotion, imagination, nature, and individual freedom.

William Wordsworth (1770–1850) and Samuel Taylor Coleridge launched the English Romantic movement with their joint publication, Lyrical Ballads (1798). Wordsworth's preface declared that poetry should be written in "the real language of men" and should capture "the spontaneous overflow of powerful feelings." His poem "Tintern Abbey" meditates on the restorative power of nature, memory, and the passage of time.

John Keats (1795–1821), despite his tragically short life, produced some of the most exquisite poetry in the English language. His odes — "Ode to a Nightingale," "Ode on a Grecian Urn," "To Autumn" — explore beauty, mortality, and the relationship between art and life. Keats's concept of "Negative Capability" — the capacity to remain in uncertainty without reaching for fact and reason — has profoundly influenced literary criticism.

Percy Bysshe Shelley (1792–1822) combined radical politics with lyrical brilliance. His poem "Ozymandias" is a meditation on the transience of power, while "Ode to the West Wind" invokes nature as a force of both destruction and renewal. Lord Byron (1788–1824), the most flamboyant of the Romantics, created the archetype of the Byronic hero — brooding, rebellious, and magnetically attractive.

## Chapter 3: The Victorian Novel

The Victorian era (1837–1901) saw the rise of the novel as the dominant literary form. Charles Dickens, the most popular novelist of the age, combined social criticism with vivid storytelling. Works like Oliver Twist, David Copperfield, Great Expectations, and A Tale of Two Cities exposed the injustices of industrialization, child labor, and the class system while creating some of the most memorable characters in fiction.

Charlotte Brontë's Jane Eyre (1847) broke new ground with its first-person narration by a passionate, independent woman who refuses to compromise her principles. Her sister Emily's Wuthering Heights (1847) is a wild, elemental tale of love, revenge, and the Yorkshire moors that defied Victorian conventions.

George Eliot (the pen name of Mary Ann Evans) brought intellectual rigor and psychological depth to the novel. Middlemarch (1871–72), often considered the greatest English novel, weaves together multiple storylines in a provincial town, exploring themes of idealism, marriage, politics, and the constraints imposed on women by society.

Thomas Hardy's novels — Tess of the d'Urbervilles, Far from the Madding Crowd, Jude the Obscure — depict characters trapped by fate, social convention, and an indifferent universe. His fatalistic vision and unflinching portrayal of rural life's hardships marked a transition toward modern sensibilities.

## Chapter 4: Modernism — Breaking the Mold

Modernism emerged in the early 20th century as writers responded to the upheavals of World War I, urbanization, and the collapse of traditional certainties. Modernist literature is characterized by experimentation with form, fragmentation, stream of consciousness, and a preoccupation with subjective experience.

James Joyce's Ulysses (1922) is the supreme achievement of modernist fiction. Set on a single day in Dublin — June 16, 1904 — the novel follows Leopold Bloom through the ordinary activities of urban life while employing a dazzling array of literary techniques. Each of the 18 episodes adopts a different style, from interior monologue to newspaper headlines to dramatic catechism, creating a comprehensive portrait of human consciousness.

Virginia Woolf developed her own version of stream of consciousness in novels like Mrs Dalloway (1925), To the Lighthouse (1927), and The Waves (1931). Woolf's prose captures the fluid, associative nature of thought, moving freely between past and present, memory and perception. Her essay "A Room of One's Own" (1929) remains a foundational text of feminist literary criticism.

T.S. Eliot's poem "The Waste Land" (1922) is the defining poetic work of modernism. Its fragmented structure, multiple voices, and dense web of literary and cultural allusions reflect the disillusionment and spiritual emptiness of the post-war world. The poem's famous opening — "April is the cruellest month, breeding / Lilacs out of the dead land" — inverts conventional associations of spring with renewal.

## Chapter 5: Post-War Literature and Beyond

The aftermath of World War II produced literature marked by existential questioning, absurdist themes, and political engagement. Samuel Beckett's Waiting for Godot (1953) stripped drama to its essentials: two tramps wait endlessly for a figure who never arrives, embodying the human condition in all its comic futility.

The Beats — Jack Kerouac, Allen Ginsberg, William S. Burroughs — rejected conformist postwar American society, celebrating spontaneity, spiritual quest, and countercultural rebellion. Kerouac's On the Road (1957) captured the restless energy of a generation seeking meaning through movement, music, and experience.

Postcolonial literature gave voice to peoples and perspectives long marginalized by Western imperialism. Chinua Achebe's Things Fall Apart (1958) told the story of colonialism in Nigeria from an African perspective, challenging the narratives of European writers like Joseph Conrad. Salman Rushdie's Midnight's Children (1981) used magical realism to explore India's turbulent history since independence.

## Chapter 6: Conclusion

From Shakespeare's stage to the fragmented landscapes of modernism and beyond, English literature has continually reinvented itself while addressing the enduring questions of human existence: Who are we? Why do we suffer? What does it mean to love, to create, to die? The works discussed in this book represent landmarks on that journey — texts that have shaped our language, our imagination, and our understanding of what it means to be human.`,
    category: "Literature",
    campus: "ZDSPGC-Dimataling Campus",
    isAvailablePhysical: true,
    totalCopies: 2,
    availableCopies: 2,
    coverUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80",
    publishedYear: 2018,
    isbn: "978-0374533557"
  },
  {
    title: "Database Systems: Design, Implementation & Management",
    author: "Carlos Coronel",
    description: "Practical handbook on SQL, relational model database design, entity-relationship diagrams, normalization, and database administration.",
    content: `# Database Systems: Design, Implementation & Management

## Chapter 1: Introduction to Databases

A database is an organized collection of structured data, stored and accessed electronically. In modern organizations, databases are the backbone of information management — from student enrollment systems at universities to inventory tracking at retail stores, from banking transactions to social media platforms.

Before databases, organizations stored data in flat files — simple text files where each line represented a record. This approach had serious limitations: data redundancy (the same information stored in multiple places), inconsistency (conflicting copies of the same data), difficulty sharing data between applications, and a lack of security controls.

A Database Management System (DBMS) is software that provides an interface between the database and its users. The DBMS handles data storage, retrieval, updating, and administration. Popular DBMS products include MySQL, PostgreSQL, Oracle Database, Microsoft SQL Server, and SQLite.

The relational model, proposed by Edgar F. Codd in 1970, organizes data into tables (relations). Each table consists of rows (tuples) and columns (attributes). The relational model's elegance lies in its mathematical foundation — relational algebra and relational calculus — which provides a rigorous basis for querying and manipulating data.

## Chapter 2: The Relational Model

In a relational database, data is organized into relations (tables). Each relation has a schema that defines its structure: the names and data types of its attributes (columns). Each row in a relation represents a single entity or relationship.

A primary key is an attribute (or combination of attributes) that uniquely identifies each row in a table. For example, a student_id might serve as the primary key of a Students table. Primary keys must be unique and cannot contain null values.

A foreign key is an attribute in one table that references the primary key of another table, establishing a relationship between the two tables. For example, a Courses table might contain a department_id foreign key that references the Departments table, indicating which department offers each course.

Referential integrity ensures that foreign key values always reference existing primary key values. If a department is deleted from the Departments table, the DBMS must ensure that no courses reference the deleted department.

## Chapter 3: SQL — Structured Query Language

SQL (Structured Query Language) is the standard language for interacting with relational databases. It includes sublanguages for different tasks:

Data Definition Language (DDL) creates and modifies database structures. The CREATE TABLE statement defines a new table, specifying column names, data types, and constraints. The ALTER TABLE statement modifies existing tables, and DROP TABLE removes them.

Data Manipulation Language (DML) handles the data within tables. The four fundamental operations are:

SELECT — retrieves data from one or more tables. The basic syntax is:
SELECT column1, column2 FROM table_name WHERE condition;

INSERT — adds new rows to a table:
INSERT INTO table_name (column1, column2) VALUES (value1, value2);

UPDATE — modifies existing rows:
UPDATE table_name SET column1 = value1 WHERE condition;

DELETE — removes rows:
DELETE FROM table_name WHERE condition;

Joins are one of the most powerful features of SQL. They combine rows from two or more tables based on related columns. An INNER JOIN returns only matching rows. A LEFT JOIN returns all rows from the left table plus matching rows from the right table. A RIGHT JOIN does the opposite.

Aggregate functions — COUNT, SUM, AVG, MIN, MAX — perform calculations across groups of rows. Combined with GROUP BY and HAVING clauses, they enable powerful data analysis queries.

## Chapter 4: Database Design and Normalization

Good database design minimizes redundancy, ensures data integrity, and supports efficient querying. The design process typically begins with an Entity-Relationship (ER) diagram, which visually represents entities (things), their attributes (properties), and the relationships between them.

An entity is a real-world object or concept that can be distinctly identified — a student, a course, an instructor. Entities are represented as rectangles in an ER diagram. Attributes are represented as ovals connected to their entities. Relationships are represented as diamonds connecting two or more entities.

Cardinality describes the number of instances of one entity that can be associated with instances of another entity. Common cardinalities include one-to-one (1:1), one-to-many (1:N), and many-to-many (M:N). A many-to-many relationship is typically resolved by creating a junction (bridge) table.

Normalization is the process of organizing tables to reduce redundancy and dependency. The most commonly used normal forms are:

First Normal Form (1NF): Each cell contains a single atomic value; there are no repeating groups.

Second Normal Form (2NF): The table is in 1NF, and every non-key attribute depends on the entire primary key (not just part of it).

Third Normal Form (3NF): The table is in 2NF, and no non-key attribute depends on another non-key attribute (no transitive dependencies).

Boyce-Codd Normal Form (BCNF): A stricter version of 3NF where every determinant is a candidate key.

## Chapter 5: Transaction Management and Security

A transaction is a logical unit of work that consists of one or more SQL operations. Transactions must satisfy the ACID properties:

Atomicity — a transaction is all or nothing. If any part fails, the entire transaction is rolled back.

Consistency — a transaction brings the database from one valid state to another.

Isolation — concurrent transactions do not interfere with each other.

Durability — once a transaction is committed, its results are permanent, even in the event of a system failure.

Concurrency control mechanisms, such as locking and timestamp ordering, ensure that multiple users can access the database simultaneously without corrupting data. Deadlocks — situations where two transactions are each waiting for the other to release a lock — must be detected and resolved.

Database security involves authentication (verifying user identity), authorization (granting appropriate access privileges), encryption (protecting data in transit and at rest), and auditing (recording database activities for accountability).

## Chapter 6: Conclusion

Database systems are essential infrastructure for modern organizations. Understanding the relational model, mastering SQL, and applying sound design principles are fundamental skills for any information technology professional. As data volumes continue to grow, the importance of well-designed, secure, and efficient database systems will only increase.`,
    category: "Technology",
    campus: "ZDSPGC-Dimataling Campus",
    isAvailablePhysical: true,
    totalCopies: 6,
    availableCopies: 6,
    coverUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=400&q=80",
    publishedYear: 2023,
    isbn: "978-1337627900"
  },
  {
    title: "Thesis: E-Government Portal Development in Zamboanga del Sur",
    author: "Ma. Clara Santos",
    description: "A research study on designing and evaluating citizen-centric e-government service portals for local government units.",
    content: `# E-Government Portal Development in Zamboanga del Sur: A Citizen-Centric Approach

## Abstract

This thesis investigates the design, development, and evaluation of a citizen-centric e-government service portal for local government units (LGUs) in Zamboanga del Sur. The study addresses the growing need for digital public services in the province, where geographic barriers and limited government office hours hinder citizen access to essential services. Through a mixed-methods research approach combining surveys, interviews, and system testing, the study identifies citizen needs, develops a functional prototype, and evaluates its usability and effectiveness.

Keywords: e-government, citizen-centric design, digital public services, local government, Zamboanga del Sur

## Chapter 1: Introduction

The Philippines has made significant strides in e-government adoption, yet many local government units — particularly those in rural and semi-urban areas — continue to rely on paper-based processes that are slow, error-prone, and inconvenient for citizens. In Zamboanga del Sur, residents often travel long distances to provincial or municipal offices to request documents, pay fees, or access government services.

The COVID-19 pandemic underscored the urgency of digital transformation in government. Lockdowns and social distancing measures made physical visits to government offices difficult or impossible, exposing the vulnerabilities of traditional service delivery models.

This study aims to bridge the digital divide by developing an accessible, user-friendly e-government portal tailored to the specific needs of citizens in Zamboanga del Sur. The portal enables online requests for common government documents (barangay clearances, business permits, birth certificate copies), online payment of fees, appointment scheduling, and real-time tracking of request status.

Statement of the Problem: How can a citizen-centric e-government portal be designed and implemented to improve public service delivery for LGUs in Zamboanga del Sur?

## Chapter 2: Review of Related Literature

E-government refers to the use of information and communication technologies (ICTs) to deliver government services, exchange information, and facilitate communication between government and citizens. The United Nations E-Government Development Index (EGDI) ranks countries based on their online service provision, telecommunications infrastructure, and human capacity.

The Philippines ranked 73rd out of 193 countries in the 2022 UN E-Government Survey, showing improvement but lagging behind regional leaders such as Singapore (12th) and South Korea (3rd). While national agencies like PhilSys (the Philippine Identification System) and eGovPH have made progress, many LGUs lack the technical capacity and resources to implement digital services.

Citizen-centric design places the needs, preferences, and experiences of citizens at the center of the design process. Key principles include usability (the system is easy to learn and use), accessibility (the system is available to people with disabilities and those using different devices), transparency (citizens can track the status of their requests), and inclusivity (the system accommodates users with varying levels of digital literacy).

Previous studies on e-government adoption in the Philippines have identified several barriers: limited internet connectivity in rural areas, low digital literacy among older citizens, insufficient government IT budgets, and resistance to change among government employees.

## Chapter 3: Methodology

This study employed a mixed-methods research design, combining quantitative surveys with qualitative interviews and focus group discussions.

Participants: 200 citizens from five municipalities in Zamboanga del Sur participated in the needs assessment survey. Twenty government employees from the provincial and municipal levels participated in semi-structured interviews.

The development process followed the Agile methodology, with iterative cycles of design, development, testing, and feedback. The portal was built using React.js for the frontend, Node.js with Express for the backend, and PostgreSQL for the database. The system was deployed on a cloud platform for accessibility testing.

Usability testing was conducted with 50 participants using the System Usability Scale (SUS) and task-completion analysis. Participants were asked to complete five common tasks: creating an account, requesting a barangay clearance, paying a fee, scheduling an appointment, and checking request status.

## Chapter 4: Results and Discussion

The needs assessment survey revealed that 78% of respondents had experienced difficulty accessing government services due to distance, long queues, or limited office hours. The most frequently requested services were barangay clearances (67%), business permits (45%), and civil registry documents (38%).

The developed portal achieved a System Usability Scale score of 82.5, which falls in the "excellent" range (above 80.3). Task completion rates were high: 96% for account creation, 88% for document requests, 84% for online payments, 92% for appointment scheduling, and 90% for status tracking.

Government employee interviews revealed both enthusiasm and concern. While 85% of interviewees recognized the benefits of digital service delivery, 60% expressed concern about the transition period, training requirements, and potential job displacement.

The study also identified challenges specific to the Zamboanga del Sur context: intermittent internet connectivity in mountainous barangays, the need for multilingual support (Filipino, Cebuano, and Subanen), and the importance of integrating with existing government information systems.

## Chapter 5: Conclusions and Recommendations

The study demonstrates that a citizen-centric e-government portal is both technically feasible and highly desired by citizens of Zamboanga del Sur. The prototype achieved strong usability scores and high task completion rates, suggesting that well-designed digital government services can significantly improve public service delivery in the province.

Recommendations:

1. The Provincial Government of Zamboanga del Sur should allocate budget for the full implementation and maintenance of the e-government portal.

2. A comprehensive training program should be developed for both government employees and citizens, with particular attention to older adults and residents in areas with limited digital literacy.

3. The portal should be designed to function on low-bandwidth connections and should offer an offline mode for basic information access.

4. Future research should explore the integration of mobile money services (GCash, Maya) for government fee payments and the use of SMS notifications for citizens without internet access.

5. The success of the portal should be measured not only by usage statistics but also by citizen satisfaction, processing time reduction, and transparency improvements.

## References

United Nations Department of Economic and Social Affairs. (2022). United Nations E-Government Survey 2022.

Department of Information and Communications Technology (DICT). (2021). Philippine E-Government Master Plan 2022-2028.

Nielsen, J. (2012). Usability Engineering. Academic Press.

Heeks, R. (2006). Implementing and Managing eGovernment: An International Text. Sage Publications.`,
    category: "Thesis",
    campus: "ZDSPGC-Dimataling Campus",
    isAvailablePhysical: false,
    totalCopies: 0,
    availableCopies: 0,
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    publishedYear: 2024,
    isbn: "THESIS-2024-001"
  },
  {
    title: "Understanding Algorithms",
    author: "Richard Neapolitan",
    description: "A comprehensive guide to analyzing and designing algorithms.",
    content: `# Understanding Algorithms

## Chapter 1: Foundations of Algorithm Analysis

An algorithm is a step-by-step procedure for solving a problem or accomplishing a task in a finite number of steps. Every computer program is an implementation of one or more algorithms. Understanding how to design efficient algorithms and analyze their performance is one of the most important skills in computer science.

Algorithm analysis is concerned with predicting the resources an algorithm requires — primarily time and memory (space). We use asymptotic notation to describe how an algorithm's resource usage grows as the input size increases.

Big-O notation (O) describes an upper bound on growth rate. If an algorithm runs in O(n²) time, its running time grows at most proportionally to the square of the input size for sufficiently large inputs. Big-O ignores constant factors and lower-order terms, focusing on the dominant behavior.

Big-Omega (Ω) provides a lower bound, and Big-Theta (Θ) gives a tight bound, meaning the algorithm's growth rate is both O and Ω of the given function. For example, Merge Sort runs in Θ(n log n) time for all inputs, while Quicksort runs in O(n²) worst-case but Θ(n log n) on average.

## Chapter 2: Sorting Algorithms

Sorting — arranging elements in a specified order — is one of the most fundamental and well-studied problems in computer science. Efficient sorting is critical because many other algorithms rely on sorted data.

Insertion Sort builds the sorted array one element at a time. For each new element, it finds the correct position in the already-sorted portion and inserts it there. Insertion Sort runs in O(n²) worst-case time but performs well on small or nearly sorted arrays, making it useful in practice as a subroutine.

Merge Sort uses the divide-and-conquer strategy. It divides the array in half, recursively sorts each half, and then merges the two sorted halves. The merge operation takes O(n) time, and since the array is halved at each level of recursion (creating O(log n) levels), the total running time is O(n log n). Merge Sort is stable (it preserves the relative order of equal elements) and guarantees O(n log n) performance regardless of input.

Quicksort also uses divide-and-conquer, but partitions the array around a pivot element rather than dividing it in half. Elements smaller than the pivot go to the left; elements larger go to the right. Quicksort then recursively sorts the two partitions. Its average-case performance is O(n log n), but poor pivot choices can lead to O(n²) worst-case behavior. Randomized pivot selection mitigates this risk.

Heap Sort uses a binary heap data structure to sort elements in O(n log n) time. It first builds a max-heap from the input array, then repeatedly extracts the maximum element and places it at the end of the array.

## Chapter 3: Searching Algorithms

Linear Search examines each element of an array in sequence until the target is found or the array is exhausted. It runs in O(n) time and requires no preprocessing. For unsorted data, linear search is often the only option.

Binary Search works on sorted arrays by repeatedly dividing the search interval in half. If the target is less than the middle element, search the left half; if greater, search the right half. Binary Search runs in O(log n) time, making it dramatically faster than linear search for large datasets. Searching through one million sorted elements requires at most 20 comparisons.

Hash-based searching uses a hash function to map keys directly to array positions, enabling O(1) average-case lookups. Hash tables are the foundation of many efficient data structures, including Python dictionaries, JavaScript objects, and database indexes.

## Chapter 4: Graph Algorithms

A graph is a collection of vertices (nodes) connected by edges. Graphs model a vast range of real-world problems: social networks (people and friendships), transportation systems (cities and roads), computer networks (devices and connections), and dependency relationships (tasks and prerequisites).

Breadth-First Search (BFS) explores a graph level by level, visiting all neighbors of a vertex before moving to the next level. BFS finds the shortest path (in terms of number of edges) between a source vertex and all other vertices. It runs in O(V + E) time, where V is the number of vertices and E is the number of edges.

Depth-First Search (DFS) explores a graph by going as deep as possible along each branch before backtracking. DFS is useful for detecting cycles, performing topological sorting, and finding connected components.

Dijkstra's Algorithm finds the shortest path from a single source to all other vertices in a weighted graph with non-negative edge weights. It maintains a priority queue of vertices ordered by their current shortest distance from the source, repeatedly extracting the minimum and updating its neighbors. With a binary heap, Dijkstra's runs in O((V + E) log V) time.

## Chapter 5: Dynamic Programming

Dynamic programming (DP) is an algorithmic technique for solving optimization problems by breaking them into overlapping subproblems and storing their solutions to avoid redundant computation.

The classic example is the Fibonacci sequence. A naive recursive implementation has exponential time complexity O(2^n) because it recomputes the same subproblems many times. A DP approach stores previously computed values in a table, reducing the time complexity to O(n).

The Longest Common Subsequence (LCS) problem finds the longest subsequence common to two sequences. It has applications in bioinformatics (comparing DNA sequences), version control (computing diffs), and spell checking. The DP solution uses a two-dimensional table and runs in O(mn) time, where m and n are the lengths of the two sequences.

The Knapsack Problem asks: given a set of items, each with a weight and a value, which items should be selected to maximize total value without exceeding a weight capacity? The 0/1 Knapsack variant (each item is either taken or not) can be solved with DP in O(nW) time, where n is the number of items and W is the capacity.

## Chapter 6: Conclusion

Algorithms are the heart of computer science. By understanding fundamental algorithmic techniques — sorting, searching, graph traversal, dynamic programming — and the tools for analyzing their efficiency, we gain the ability to solve complex problems effectively and build performant software systems. The study of algorithms is not just academic; it is deeply practical and increasingly important in our data-driven world.`,
    category: "Technology",
    campus: "ZDSPGC-Dimataling Campus",
    isAvailablePhysical: true,
    totalCopies: 5,
    availableCopies: 5,
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    coverUrl: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=400&q=80",
    publishedYear: 2018,
    isbn: "978-0123456789"
  },
  {
    title: "Digital Logic Design",
    author: "M. Morris Mano",
    description: "Introductory text on digital logic and computer design.",
    content: `# Digital Logic Design

## Chapter 1: Number Systems and Binary Arithmetic

Digital systems operate using binary (base-2) numbers, where each digit — called a bit — can be either 0 or 1. Understanding number systems is essential for working with digital circuits and computer architecture.

The decimal (base-10) system uses digits 0–9 and positional notation. The number 347 represents 3×10² + 4×10¹ + 7×10⁰. Binary works the same way but with base 2. The binary number 1011 represents 1×2³ + 0×2² + 1×2¹ + 1×2⁰ = 8 + 0 + 2 + 1 = 11 in decimal.

Hexadecimal (base-16) uses digits 0–9 and letters A–F (representing 10–15). It provides a compact way to represent binary values: each hexadecimal digit corresponds to exactly four binary digits. For example, the binary number 1010 1111 can be written as AF in hexadecimal.

Octal (base-8) groups binary digits into sets of three. While less common than hexadecimal, it is still used in some contexts, such as Unix file permissions.

Binary arithmetic follows the same rules as decimal arithmetic. Addition: 0+0=0, 0+1=1, 1+0=1, 1+1=10 (0 with a carry of 1). Subtraction can be performed using the two's complement method, which represents negative numbers by inverting all bits and adding 1. This allows subtraction to be performed using addition circuits, simplifying hardware design.

## Chapter 2: Boolean Algebra and Logic Gates

Boolean algebra is the mathematical foundation of digital logic. It operates on binary variables that can take values of 0 (false) or 1 (true). The three fundamental operations are:

AND (conjunction): The output is 1 only when all inputs are 1. Symbol: A · B or AB.
OR (disjunction): The output is 1 when at least one input is 1. Symbol: A + B.
NOT (negation): The output is the complement of the input. Symbol: A' or Ā.

From these three operations, all other logical functions can be derived:

NAND (NOT AND): The complement of AND. Universal gate — any logic function can be built using only NAND gates.
NOR (NOT OR): The complement of OR. Also a universal gate.
XOR (Exclusive OR): Output is 1 when inputs differ. Essential for arithmetic and error detection.
XNOR (Exclusive NOR): Output is 1 when inputs are the same.

Boolean algebra follows several important laws: commutative (A+B = B+A), associative ((A+B)+C = A+(B+C)), distributive (A·(B+C) = A·B+A·C), identity (A+0=A, A·1=A), complement (A+A'=1, A·A'=0), and De Morgan's theorems (the complement of a sum equals the product of complements, and vice versa).

## Chapter 3: Combinational Logic Circuits

Combinational circuits produce outputs that depend solely on the current inputs, with no memory of past states. They can be described by Boolean expressions, truth tables, or circuit diagrams.

Multiplexers (MUX) select one of several input signals based on select lines. A 2-to-1 MUX has two data inputs, one select line, and one output. A 4-to-1 MUX has four data inputs and two select lines.

Decoders convert a binary code into a set of output signals, activating exactly one output for each input combination. An n-to-2ⁿ decoder has n input lines and 2ⁿ output lines. Decoders are used in memory address selection and instruction decoding.

Encoders perform the reverse of decoding: they accept multiple inputs (of which only one is active at a time) and produce a binary code representing the active input's position.

Adders are essential building blocks. A half adder adds two single-bit numbers, producing a sum and a carry. A full adder adds three bits (two operands plus a carry-in) and produces a sum and carry-out. Cascading full adders creates a ripple-carry adder capable of adding multi-bit numbers.

## Chapter 4: Sequential Logic Circuits

Sequential circuits have memory — their outputs depend not only on current inputs but also on the history of past inputs. The fundamental memory element is the flip-flop.

An SR (Set-Reset) flip-flop has two inputs: S (set) and R (reset). Setting S=1, R=0 stores a 1; S=0, R=1 stores a 0; S=R=0 maintains the current state; S=R=1 is an invalid condition.

A D (Data) flip-flop captures the value of its data input at the moment of a clock edge (rising or falling). It is the most commonly used flip-flop in modern digital design because it avoids the invalid state problem of the SR flip-flop.

A JK flip-flop is a refined version of the SR flip-flop where the J=K=1 condition causes the output to toggle (switch between 0 and 1). It is the most versatile flip-flop type.

Registers are groups of flip-flops that store multi-bit values. A 4-bit register uses four flip-flops to store a 4-bit binary number. Shift registers can move data left or right one position per clock cycle, useful for serial-to-parallel conversion and data communication.

Counters are sequential circuits that cycle through a predetermined sequence of states. A binary counter counts in binary (000, 001, 010, 011, 100, ...), incrementing by one with each clock pulse.

## Chapter 5: Memory and Programmable Logic

Memory stores data and instructions for processing. There are two main categories:

Random Access Memory (RAM) allows data to be read and written in any order. Static RAM (SRAM) uses flip-flops and is fast but expensive. Dynamic RAM (DRAM) uses capacitors and is denser and cheaper but requires periodic refreshing.

Read-Only Memory (ROM) stores data permanently (or semi-permanently). It is used for firmware, boot programs, and lookup tables. Variants include PROM (programmable once), EPROM (erasable with UV light), EEPROM (electrically erasable), and Flash memory (used in USB drives and SSDs).

Programmable Logic Devices (PLDs) allow users to implement custom digital circuits. Field-Programmable Gate Arrays (FPGAs) contain thousands or millions of configurable logic blocks that can be programmed to implement virtually any digital circuit. FPGAs are widely used in prototyping, telecommunications, aerospace, and high-performance computing.

## Chapter 6: Conclusion

Digital logic is the foundation upon which all modern computing systems are built. From the simple AND gate to complex processors containing billions of transistors, the principles of Boolean algebra, combinational logic, and sequential circuits remain constant. Mastering these fundamentals provides the essential groundwork for careers in computer engineering, embedded systems, VLSI design, and beyond.`,
    category: "Technology",
    campus: "ZDSPGC-Dimataling Campus",
    isAvailablePhysical: false,
    totalCopies: 0,
    availableCopies: 0,
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    coverUrl: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=400&q=80",
    publishedYear: 2021,
    isbn: "978-0131989269"
  },
  {
    title: "Advanced Mathematics for Engineers",
    author: "Erwin Kreyszig",
    description: "Comprehensive coverage of advanced mathematics required for engineering.",
    content: `# Advanced Mathematics for Engineers

## Chapter 1: Ordinary Differential Equations

Differential equations are equations that involve an unknown function and one or more of its derivatives. They arise naturally in engineering, physics, biology, economics, and virtually every field where change is modeled mathematically.

An ordinary differential equation (ODE) involves a function of a single variable and its derivatives. A first-order ODE has the general form dy/dx = f(x, y). For example, dy/dx = 3x² is a simple first-order ODE whose solution is y = x³ + C, where C is an arbitrary constant determined by initial conditions.

Separable equations have the form dy/dx = g(x)h(y) and can be solved by separating variables: (1/h(y))dy = g(x)dx, then integrating both sides. For example, dy/dx = xy can be separated as (1/y)dy = x dx, giving ln|y| = x²/2 + C, or y = Ae^(x²/2).

Linear first-order ODEs have the form dy/dx + P(x)y = Q(x). They are solved using an integrating factor μ(x) = e^(∫P(x)dx). The solution is y = (1/μ(x))∫μ(x)Q(x)dx.

Second-order linear ODEs with constant coefficients, y'' + ay' + by = 0, are solved by finding the roots of the characteristic equation r² + ar + b = 0. If the roots are real and distinct (r₁ ≠ r₂), the general solution is y = c₁e^(r₁x) + c₂e^(r₂x). If repeated (r₁ = r₂ = r), the solution is y = (c₁ + c₂x)e^(rx). If complex (r = α ± βi), the solution is y = e^(αx)(c₁cos(βx) + c₂sin(βx)).

## Chapter 2: Linear Algebra

Linear algebra is the branch of mathematics concerned with vectors, vector spaces, linear transformations, and systems of linear equations. It is fundamental to virtually every area of engineering and applied science.

A vector in ℝⁿ is an ordered list of n real numbers. Vectors can be added component-wise and multiplied by scalars. The dot product of two vectors a = (a₁, a₂, ..., aₙ) and b = (b₁, b₂, ..., bₙ) is a · b = a₁b₁ + a₂b₂ + ... + aₙbₙ. The dot product is related to the angle between vectors: a · b = |a||b|cos θ.

A matrix is a rectangular array of numbers. An m×n matrix has m rows and n columns. Matrices can be added (if they have the same dimensions) and multiplied (if the number of columns of the first equals the number of rows of the second). Matrix multiplication is associative but not commutative: AB ≠ BA in general.

A system of linear equations Ax = b can be solved using Gaussian elimination, which reduces the augmented matrix [A|b] to row echelon form through elementary row operations. If the system has a unique solution, back substitution yields the values of all unknowns.

Eigenvalues and eigenvectors are central concepts. For a square matrix A, a scalar λ is an eigenvalue if there exists a nonzero vector v such that Av = λv. Eigenvalues are found by solving det(A - λI) = 0. Eigenvectors reveal the directions along which a linear transformation acts by simple scaling, and they are essential in stability analysis, vibration analysis, and principal component analysis.

## Chapter 3: Fourier Analysis

Fourier analysis decomposes functions into sums of sinusoidal components. It is one of the most powerful tools in engineering, with applications in signal processing, acoustics, image compression, heat transfer, and quantum mechanics.

Joseph Fourier showed in 1807 that any periodic function f(x) with period 2π can be represented as an infinite sum of sines and cosines:

f(x) = a₀/2 + Σ(aₙcos(nx) + bₙsin(nx))

where the coefficients are:
a₀ = (1/π)∫f(x)dx over one period
aₙ = (1/π)∫f(x)cos(nx)dx
bₙ = (1/π)∫f(x)sin(nx)dx

The Fourier transform extends this idea to non-periodic functions, transforming a function from the time domain to the frequency domain. The transform of f(t) is F(ω) = ∫f(t)e^(-iωt)dt, and the inverse transform recovers the original function.

The Fast Fourier Transform (FFT), developed by Cooley and Tukey in 1965, computes the Discrete Fourier Transform in O(n log n) operations instead of O(n²), making Fourier analysis computationally practical for large datasets. The FFT is used in audio processing, telecommunications, medical imaging, and countless other applications.

## Chapter 4: Partial Differential Equations

Partial differential equations (PDEs) involve functions of multiple variables and their partial derivatives. They describe phenomena where change occurs in more than one dimension — heat flow, wave propagation, fluid dynamics, electromagnetic fields.

The heat equation ∂u/∂t = k∂²u/∂x² describes how temperature u(x,t) evolves over time in a one-dimensional rod. The constant k is the thermal diffusivity of the material. Solutions typically involve separation of variables, where u(x,t) = X(x)T(t), leading to two ordinary differential equations that can be solved independently.

The wave equation ∂²u/∂t² = c²∂²u/∂x² describes the propagation of waves — vibrating strings, sound waves, electromagnetic waves. The constant c is the wave speed. D'Alembert's solution shows that the general solution is u(x,t) = f(x-ct) + g(x+ct), representing waves traveling in opposite directions.

Laplace's equation ∂²u/∂x² + ∂²u/∂y² = 0 describes steady-state temperature distributions, electrostatic potentials, and fluid flow in two dimensions. Solutions to Laplace's equation are called harmonic functions and have the remarkable property that the value at any point equals the average of the values on any surrounding circle.

## Chapter 5: Probability and Statistics

Probability theory provides the mathematical framework for modeling uncertainty. A random variable X assigns a numerical value to each outcome of a random experiment. Discrete random variables take countable values (e.g., the number of defective items in a batch), while continuous random variables take values in an interval (e.g., the lifetime of a component).

The expected value (mean) of a random variable, E(X) = Σx·P(X=x) for discrete or E(X) = ∫x·f(x)dx for continuous, represents the long-run average. The variance Var(X) = E[(X-μ)²] measures the spread of values around the mean. The standard deviation σ = √Var(X) has the same units as X.

The normal (Gaussian) distribution is the most important probability distribution in engineering. Its bell-shaped curve is characterized by two parameters: the mean μ and the standard deviation σ. The Central Limit Theorem states that the sum of many independent random variables is approximately normally distributed, regardless of the individual distributions — explaining why the normal distribution appears so frequently in practice.

Statistical hypothesis testing allows engineers to make decisions based on data. A null hypothesis H₀ (e.g., "the mean lifetime is at least 1000 hours") is tested against an alternative hypothesis H₁. The p-value — the probability of observing the data if H₀ is true — determines whether to reject H₀.

## Chapter 6: Conclusion

Advanced mathematics provides the essential toolkit for engineering problem-solving. Differential equations model dynamic systems, linear algebra enables efficient computation, Fourier analysis reveals the frequency content of signals, and probability theory quantifies uncertainty. These mathematical foundations are not abstract exercises — they are the language in which engineering principles are expressed and the tools with which real-world problems are solved.`,
    category: "Science",
    campus: "ZDSPGC-Dimataling Campus",
    isAvailablePhysical: true,
    totalCopies: 3,
    availableCopies: 2,
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    coverUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=400&q=80",
    publishedYear: 2020,
    isbn: "978-1119455929"
  }
];

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not defined in the environment.");
    process.exit(1);
  }

  console.log("Connecting to the database...");
  const client = new Client({ connectionString });
  await client.connect();

  try {
    console.log("Checking existing books...");
    const res = await client.query("SELECT title FROM books");
    const existingTitles = new Set(res.rows.map(row => row.title));

    console.log("Seeding books...");
    for (const book of books) {
      if (existingTitles.has(book.title)) {
        // Update existing books to add content if they don't have it yet
        await client.query(
          `UPDATE books SET content = $1 WHERE title = $2 AND (content IS NULL OR content = '')`,
          [book.content || null, book.title]
        );
        console.log(`Updated content for: "${book.title}"`);
        continue;
      }

      await client.query(
        `INSERT INTO books (
          title, author, description, content, category, campus, 
          is_available_physical, total_copies, available_copies, 
          cover_url, file_url, published_year, isbn
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          book.title,
          book.author,
          book.description,
          book.content || null,
          book.category,
          book.campus,
          book.isAvailablePhysical,
          book.totalCopies,
          book.availableCopies,
          book.coverUrl || null,
          book.fileUrl || null,
          book.publishedYear || null,
          book.isbn || null
        ]
      );
      console.log(`Successfully added: "${book.title}"`);
    }
    console.log("Database seeding completed successfully.");
  } catch (err) {
    console.error("Error seeding database:", err);
  } finally {
    await client.end();
  }
}

seed();
