import pg from "pg";

const { Client } = pg;

const instructors = [
  // NEW
  { full_name: "SACAYAN, NESTLE N.", school_id: "30164" },
  { full_name: "ALCOREZA, DINE B.", school_id: "30165" },
  { full_name: "INSPIDO, SHAINA P.", school_id: "30166" },
  { full_name: "RODRIGUEZ, CREZIL E.", school_id: "30167" },
  { full_name: "SABIRIN, BENJAR A.", school_id: "30168" },
  { full_name: "QUIMIGING, WELCHIE T.", school_id: "30169" },
  { full_name: "YLISON, ACE G.", school_id: "30170" },
  { full_name: "MALALISBANG, CHARISH A.", school_id: "30171" },
  { full_name: "PACAMAMAN, HANNA T.", school_id: "30172" },
  { full_name: "VILLA, JANDEL A.", school_id: "30173" },
  { full_name: "LAPAD, EVELYN P.", school_id: "30174" },
  { full_name: "BILLONES, ELVIE B.", school_id: "30175" },
  { full_name: "DENOPOL, KENETH", school_id: "30176" },
  { full_name: "LAMBAN, JOANNAH LEA S.", school_id: "30177" },
  { full_name: "BARREDO, DESIREE MAY M.", school_id: "30178" },
  { full_name: "PANUNCILLON, MAICKY B.", school_id: "30179" },
  { full_name: "MAGLANGIT, MARYELL M.", school_id: "30180" },
  { full_name: "REYES, RENILYN O.", school_id: "30181" },
  { full_name: "BULAC, PREACH M.", school_id: "30182" },
  { full_name: "VISANDE, RAHHYA ANGELICA B.", school_id: "30183" },
  { full_name: "DEL APER, MANUEL M.", school_id: "30184" },
  { full_name: "TANDONG, SADDAM S.", school_id: "30185" },
  { full_name: "BOLO, CERRAY-JANE V.", school_id: "30186" },
  { full_name: "CAMIGING, REYMARK M.", school_id: "30187" },
  { full_name: "MARTONIA, JOSTIN KARL A.", school_id: "30188" },
  { full_name: "ABAPO, GENESIS M.", school_id: "30189" },
  { full_name: "MATUGAS, JUNFIL M.", school_id: "30190" },
  { full_name: "MACADATAR, BAILIN D.", school_id: "30191" },
  { full_name: "ACAL, JAMES B", school_id: "30192" },
  { full_name: "SALES, AR JOHN O.", school_id: "30193" },
  { full_name: "SUMALPONG, NEIL JAME T.", school_id: "30194" },
  { full_name: "DATANAGAN, BONNIEBE T.", school_id: "30195" },
  { full_name: "SALIMBANGON, JOSEPH B.", school_id: "30196" },
  { full_name: "TIONGCO, ARVI C.", school_id: "30197" },
  { full_name: "SANCHEZ, JOHN VINCENT", school_id: "30198" },
  { full_name: "BENDECIO,RENPAUL ROY J.", school_id: "30199" },
  { full_name: "RAMBOY, MERY LYN", school_id: "30200" },
  { full_name: "THUNDAS, NINEL A.", school_id: "30201" },

  // OLD
  { full_name: "ACTUB, CHERIE U.", school_id: "29569" },
  { full_name: "ADOLFO, CHRISTINA B.", school_id: "29431" },
  { full_name: "CONCILBA, CLIEFORD", school_id: "29831" },
  { full_name: "GUMINTAD, ADELIA A.", school_id: "29830" },
  { full_name: "HENERAL AO, BRYAN C.", school_id: "30138" },
  { full_name: "LANGUIDO JR, PEDRO B.", school_id: "29433" },
  { full_name: "LIMBAGA, MARWIN", school_id: "29503" },
  { full_name: "MACALDO-OY, JILLY E.", school_id: "29835" },
  { full_name: "MAMINTAS, BERNADITH C.", school_id: "29827" },
  { full_name: "MINAO, NINA MARIZ ANN S.", school_id: "29575" },
  { full_name: "MONTEMAYOR, FELY NETH", school_id: "29832" },
  { full_name: "OCANG, ROMILYN B.", school_id: "29576" },
  { full_name: "PANUNCILLON, RICKY", school_id: "29505" },
  { full_name: "RUBIO, RICKY L.", school_id: "29506" },
  { full_name: "TANLANGIT, REYNOLD S.", school_id: "29435" },
  { full_name: "VERGARA, LORENA S.", school_id: "29436" },
  { full_name: "ABBAS, ALIMUDIN C.", school_id: "30155" },
  { full_name: "ALBELLAR, JEFFRYL DAVE S.", school_id: "28933" },
  { full_name: "ALBIOS, AMAJANE A.", school_id: "30142" },
  { full_name: "AUTIDA, MARJUL Y.", school_id: "30151" },
  { full_name: "BACARON, JAZZ P.", school_id: "30144" },
  { full_name: "BANCALE, RRONIELYN S.", school_id: "30153" },
  { full_name: "BUCA, DANILO", school_id: "30156" },
  { full_name: "CATALUÑA, EDUARDO A.", school_id: "30152" },
  { full_name: "DALION, PINKY MAE", school_id: "30150" },
  { full_name: "ETA, ALVIN P.", school_id: "30148" },
  { full_name: "FIEL, LOVELY I.", school_id: "30146" },
  { full_name: "GILLAMAC, RONALD D.", school_id: "30147" },
  { full_name: "JABLA, WIEZEL C.", school_id: "30145" },
  { full_name: "LUMAYAG, HOPE H.", school_id: "30139" },
  { full_name: "MACASLING, CRIS S.", school_id: "30141" },
  { full_name: "MAMANGCAO, JENAISHA I.", school_id: "30157" },
  { full_name: "MANGAO, CRISANIE", school_id: "30161" },
  { full_name: "MEJORADA, MARVIN C.", school_id: "30149" },
  { full_name: "PATONG, JESSON B.", school_id: "30159" },
  { full_name: "PITOGO, ROLANDO P.", school_id: "30163" },
  { full_name: "RAPOL, ROLANDO Y.", school_id: "30162" },
  { full_name: "RODRIGUEZ, JULIET B.", school_id: "30140" },
  { full_name: "SUMATRA, MAYNARD", school_id: "30154" },
  { full_name: "TABANAO, LUCILA E.", school_id: "30143" },
  { full_name: "VISANDE, MARIE JEAN B.", school_id: "30158" },
];

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to database.");

    let inserted = 0;
    for (const instructor of instructors) {
      try {
        await client.query(
          `INSERT INTO "authorized_users" (full_name, school_id, role) VALUES ($1, $2, $3) ON CONFLICT (school_id) DO NOTHING`,
          [instructor.full_name, instructor.school_id, 'instructor']
        );
        inserted++;
      } catch (err) {
        console.error(`Failed to insert ${instructor.full_name}: ${err.message}`);
      }
    }

    console.log(`Successfully seeded ${inserted} instructors into authorized_users table.`);
  } catch (err) {
    console.error("Database connection error", err);
  } finally {
    await client.end();
  }
}

seed();
