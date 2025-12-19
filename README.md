# B2C Supply Chain System

A blockchain-enabled supply chain tracking system where buyers, sellers, and logistics providers can interact transparently. Built with **Next.js 14**, **Hardhat (Ethereum/Solidity)**, and **PostgreSQL**.

## 🎯 Overview

This system provides a complete B2C (Business-to-Consumer) supply chain management platform with blockchain integration for transparency and auditability. Key features include:

- **User Management**: Role-based access (Buyer, Seller, Logistics Provider)
- **Inventory Management**: Product listing and stock tracking
- **Order Processing**: Complete order lifecycle management
- **Shipment Tracking**: Real-time shipment status updates
- **Blockchain Integration**: All critical events recorded on-chain
- **Wallet System**: Integrated wallet balance management
- **Profile Management**: Comprehensive user profiles with blockchain identity

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd b2c-supply-chain-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up database** (See [SETUP.md](./SETUP.md))
   ```bash
   psql -U postgres -f scripts/setup_db_complete.sql
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database and blockchain settings
   ```

5. **Start Hardhat node** (Terminal 1)
   ```bash
   npx hardhat node
   ```

6. **Deploy contract** (Terminal 2)
   ```bash
   npx hardhat run scripts/deploy.ts --network localhost
   # Copy CONTRACT_ADDRESS to .env
   ```

7. **Run application** (Terminal 3)
   ```bash
   npm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to access the application.

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Comprehensive setup guide
- **[SYSTEM-FEATURE.md](./SYSTEM-FEATURE.md)** - All system features
- **[API-GUIDE.md](./API-GUIDE.md)** - API usage and guidelines
- **[USERROLE-FUNCTIONALITIES.md](./USERROLE-FUNCTIONALITIES.md)** - User roles and functionalities
- **[COMMON-PROBLEMS-FIX.md](./COMMON-PROBLEMS-FIX.md)** - Common problems and solutions
- **[SETUP-FOR-ONLINE.md](./SETUP-FOR-ONLINE.md)** - Online environment setup
- **[OTHERS.md](./OTHERS.md)** - Additional information

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, PostgreSQL
- **Blockchain**: Hardhat, Solidity, viem
- **Database**: PostgreSQL with comprehensive schema
- **Authentication**: Session-based with bcrypt password hashing

## 🏗️ Architecture

- **Database**: PostgreSQL with wallet address support and timestamp tracking
- **Blockchain**: Hardhat local node for development, Sepolia testnet for production
- **API**: RESTful API endpoints with role-based access control
- **Frontend**: Server-side rendered with client-side interactivity

## 🔐 Security Features

- Password hashing with bcrypt
- Wallet address immutability
- Role-based access control
- SQL injection prevention (parameterized queries)
- Blockchain proof of integrity

## 📊 Key Features

- ✅ User registration with auto-generated wallet addresses
- ✅ Product inventory management
- ✅ Order placement with quantity selection
- ✅ Purchase invoice display
- ✅ Order status tracking
- ✅ Shipment location updates
- ✅ Payment collection
- ✅ Blockchain event recording
- ✅ User profile management
- ✅ Wallet balance management

## 🧪 Testing

See [SETUP.md](./SETUP.md) for testing workflows and verification steps.

## 📝 License

[Your License Here]

## 🤝 Contributing

[Contributing Guidelines]

## 📞 Support

For issues and questions, refer to:
- [COMMON-PROBLEMS-FIX.md](./COMMON-PROBLEMS-FIX.md) for troubleshooting
- [API-GUIDE.md](./API-GUIDE.md) for API usage
- [SETUP.md](./SETUP.md) for setup issues
