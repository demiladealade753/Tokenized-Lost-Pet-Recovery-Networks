# Tokenized Lost Pet Recovery Networks

A decentralized blockchain-based system for managing lost pet recovery efforts using Clarity smart contracts on the Stacks blockchain.

## Overview

This system consists of five interconnected smart contracts that work together to facilitate efficient pet recovery operations:

1. **Missing Animal Contract** - Manages pet descriptions and last seen location data
2. **Search Coordination Contract** - Organizes volunteer search party efforts
3. **Reward Management Contract** - Handles finder compensation and verification
4. **Veterinary Alert Contract** - Notifies local clinics about missing pets
5. **Reunion Verification Contract** - Confirms legitimate pet owner identity

## Features

### Missing Animal Management
- Register missing pets with detailed descriptions
- Track last known locations with timestamps
- Update pet status throughout recovery process
- Store owner contact information securely

### Search Coordination
- Organize volunteer search parties
- Assign search areas to prevent overlap
- Track volunteer participation and contributions
- Coordinate search efforts efficiently

### Reward System
- Set and manage reward amounts for found pets
- Verify legitimate finders before payment
- Handle escrow of reward funds
- Distribute rewards fairly among contributors

### Veterinary Network
- Alert local veterinary clinics about missing pets
- Track which clinics have been notified
- Manage clinic participation in the network
- Facilitate quick identification of found pets

### Owner Verification
- Verify legitimate pet ownership through multiple methods
- Prevent fraudulent claims
- Secure reunion process
- Maintain ownership records

## Smart Contract Architecture

### Data Structures

Each contract maintains its own data maps and variables:

- **Pet Records**: Comprehensive pet information including breed, color, size, distinctive features
- **Location Data**: GPS coordinates, timestamps, and area descriptions
- **Search Assignments**: Volunteer assignments with designated search zones
- **Reward Pools**: Escrow accounts for reward distribution
- **Clinic Networks**: Registered veterinary facilities and alert status
- **Verification Records**: Owner identity confirmation and reunion logs

### Security Features

- Owner-only functions for sensitive operations
- Multi-step verification processes
- Immutable audit trails
- Secure fund management
- Prevention of duplicate registrations

## Getting Started

### Prerequisites
- Stacks blockchain development environment
- Clarity smart contract deployment tools
- Web3 wallet for interaction

### Deployment

1. Deploy contracts in the following order:
   \`\`\`
   clarinet deploy missing-animal-contract
   clarinet deploy search-coordination-contract
   clarinet deploy reward-management-contract
   clarinet deploy veterinary-alert-contract
   clarinet deploy reunion-verification-contract
   \`\`\`

2. Initialize each contract with appropriate parameters

3. Register initial veterinary clinics and search coordinators

### Usage

#### For Pet Owners
1. Register missing pet with detailed description
2. Set reward amount and fund escrow
3. Coordinate with search volunteers
4. Verify identity for reunion

#### For Volunteers
1. Join search coordination network
2. Accept search area assignments
3. Report findings and progress
4. Claim rewards for successful recoveries

#### for Veterinary Clinics
1. Register with the veterinary alert network
2. Receive notifications about missing pets in area
3. Report any matching animals brought in
4. Assist with owner verification

## Testing

The project includes comprehensive test suites using Vitest:

\`\`\`bash
npm test
\`\`\`

Tests cover:
- Contract deployment and initialization
- Pet registration and management
- Search coordination workflows
- Reward distribution mechanisms
- Veterinary alert systems
- Owner verification processes
- Error handling and edge cases

## Contributing

Please read our contributing guidelines and submit pull requests for any improvements.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the GitHub repository.
