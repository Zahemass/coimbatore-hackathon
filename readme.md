cli-api-tester/
│── package.json
│── cli.js                # CLI entry point
│── parser.js             # Natural language → structured task
│── tester.js             # API testing logic
│── utils/
│    ├── fileParser.js    # Parse index.js routes
│    └── promptUser.js    # CLI prompt helper
│── sample/
│    └── index.js         # Example Express API (for demo)


testing write
node cli.js "test signup api in index.js file"
node cli.js "test signup api with post"
node cli.js "test login api with get"
node cli.js autotest sample/index.js


bash
LAUNCH_UI=true node cli.js flowchart sample/frontend
 node cli.js "test the /users/:id api in index.js file"
