import pg from "pg";

const { Client } = pg;

const books = [
  {
    title: "Introduction to Computer Science",
    author: "Dr. Alan Turing",
    description: "A comprehensive guide to fundamental computer science concepts, algorithms, data structures, and computer systems architecture.",
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
        console.log(`Skipping: "${book.title}" (already exists)`);
        continue;
      }

      await client.query(
        `INSERT INTO books (
          title, author, description, category, campus, 
          is_available_physical, total_copies, available_copies, 
          cover_url, file_url, published_year, isbn
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          book.title,
          book.author,
          book.description,
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
