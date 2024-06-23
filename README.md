
# Bluesky Session Management

This is a proof-of-concept (PoC) project which demonstrates how you could handle session managment in your [Bluesky](https://bsky.app) App. I wrote this project as a practice for me to understand how authentication works. It comes with detailed explanations and a testing  enviroment.

## Getting started

### Prerequisites

- Node.js (v14.x or later)
- npm (v6.x or later)#

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/bsky_session_management.git
    cd bsky_session_management
    ```

2. Install the dependencies:
    ```sh
    npm install
    ```

## Usage

1. Build the project:
    ```sh
    npm run build
    ```

2. Start the server:
    ```sh
    npm start
    ```

3. For development mode with automatic rebuilds and restarts:
    ```sh
    npm run dev
    ```

## Scripts

- `build`: Compiles the TypeScript code into JavaScript in the `dist` directory.
- `clean`: Removes the `dist` directory.
- `start`: Cleans the `dist` directory and starts the server.
- `dev`: Cleans, compiles, and starts the server in development mode.
- `test`: Runs the tests using Jest.

## Environment Variables

Create a `.env` file (or edit the `.env.example`) in the root directory with the following variables:

```env
IDENTIFIER=yourhandle.bsky.social
PASSWORD=your-app-password
```

**Note:** Replace `yourhandle.bsky.social` with your actual Bluesky handle and `your-app-password` with generated app password.

## Project Structure

```
bsky_session_management/
├── dist/                    # Compiled JavaScript files
├── node_modules/            # Node.js modules
├── index.ts                 # Entry point of the application
├── sessionManager.ts        # Session management logic
│── test/                    # Test files
│       ├── integration.test.ts # Integration tests
│       └── unit.test.ts         # Unit tests
├── .env.example             # Example environment variables file
├── jest.config.ts           # Jest configuration
├── package.json             # Project metadata and dependencies
├── tsconfig.json            # TypeScript configuration
└── README.md                # Project documentation
```

## Testing

1. To run all tests:
    ```sh
    npm test
    ```

2. The project uses Jest for testing. Test files are located in the `/test` directory.

## License

This project is licensed under the MIT License.
