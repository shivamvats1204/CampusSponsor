CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('club', 'company', 'admin') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clubs (
  user_id INT PRIMARY KEY,
  college_name VARCHAR(255) NOT NULL,
  club_name VARCHAR(255) NOT NULL,
  description TEXT,
  past_events TEXT,
  audience_size INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_clubs_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS companies (
  user_id INT PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  marketing_goals TEXT,
  budget_range VARCHAR(50),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_companies_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  club_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  event_date DATE NOT NULL,
  venue VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  audience INT DEFAULT 0,
  brochure_url VARCHAR(255),
  poster_url VARCHAR(255),
  approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_events_club
    FOREIGN KEY (club_id) REFERENCES clubs(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tiers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  name ENUM('Bronze', 'Silver', 'Gold', 'Platinum') NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  benefits TEXT NOT NULL,
  deliverables TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tiers_event
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS collaborations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  company_id INT NOT NULL,
  tier_id INT NOT NULL,
  status ENUM('pending', 'accepted', 'rejected', 'negotiating') DEFAULT 'pending',
  message TEXT,
  negotiation_note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_collab_event
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_collab_company
    FOREIGN KEY (company_id) REFERENCES companies(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_collab_tier
    FOREIGN KEY (tier_id) REFERENCES tiers(id) ON DELETE CASCADE
);

