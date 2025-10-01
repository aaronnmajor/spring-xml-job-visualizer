# Spring XML Job Visualizer

A modern web application that parses Spring Batch XML configuration files and auto-generates a **Directed Acyclic Graph (DAG)** visualization of job execution order. Provides an intuitive "data pipeline" view that makes it easy to understand and present Spring Batch job dependencies.

## Features

- 🔍 **Automatic XML Parsing** - Parses `context-jobs.xml`, `context-template.xml`, and `context-jobs-custom.xml` files
- 📊 **DAG Visualization** - Auto-generates a clean, hierarchical view of job execution flow
- 🎨 **Modern GUI** - Beautiful, responsive web interface with gradient themes
- 🔄 **Dependency Detection** - Automatically identifies job dependencies and execution order
- ⚠️ **Cycle Detection** - Warns when circular dependencies are detected
- 📋 **Job Details** - Displays comprehensive information about each job, step, and tasklet
- 💡 **Built-in Examples** - Includes sample XML configurations for quick testing

## Quick Start

### Prerequisites

- Node.js (v12 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/aaronnmajor/spring-xml-job-visualizer.git
cd spring-xml-job-visualizer
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

### Option 1: Paste XML Content

1. Open the application in your browser
2. Paste your Spring XML configuration into the text area
3. Click "Visualize DAG"
4. View the generated pipeline visualization and job details

### Option 2: Use Built-in Examples

1. Click on the "Examples" tab
2. Select one of the pre-configured examples:
   - **Simple Job** - Basic job with linear steps
   - **Complex Pipeline** - Multi-stage ETL pipeline
   - **Custom Jobs** - Advanced configuration with parallel processing
3. Click "Visualize DAG"

### Option 3: Load from File

The API also supports loading XML files directly:

```javascript
fetch('/api/parse-file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
        filePath: './examples/context-jobs.xml' 
    })
});
```

## Supported XML Elements

The visualizer recognizes Spring Batch beans with these characteristics:

- **Jobs** - Beans with class containing "Job"
- **Steps** - Beans with class containing "Step"
- **Tasklets** - Beans with class containing "Tasklet"

### Dependency Detection

Dependencies are detected through:
- `<property name="..." ref="..."/>` - Property references
- `<constructor-arg ref="..."/>` - Constructor argument references
- `<property name="previous" ref="..."/>` - Previous step references
- `<property name="dependency" ref="..."/>` - Explicit dependencies

## Example XML Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">

    <bean id="dataLoadTasklet" class="com.example.batch.DataLoadTasklet"/>
    
    <bean id="dataLoadStep" class="org.springframework.batch.core.Step">
        <property name="tasklet" ref="dataLoadTasklet"/>
    </bean>
    
    <bean id="transformationStep" class="org.springframework.batch.core.Step">
        <property name="previous" ref="dataLoadStep"/>
    </bean>
    
    <bean id="dataProcessingJob" class="org.springframework.batch.core.Job">
        <property name="steps" ref="transformationStep"/>
    </bean>
</beans>
```

## API Endpoints

### POST /api/parse

Parse XML content and generate DAG.

**Request:**
```json
{
    "xml": "<beans>...</beans>"
}
```

**Response:**
```json
{
    "dag": {
        "nodes": [...],
        "edges": [...]
    },
    "executionOrder": [...],
    "levels": [...],
    "hasCycles": false,
    "cycles": []
}
```

### POST /api/parse-file

Parse XML file and generate DAG.

**Request:**
```json
{
    "filePath": "./examples/context-jobs.xml"
}
```

## Project Structure

```
spring-xml-job-visualizer/
├── src/
│   ├── server.js        # HTTP server
│   ├── xmlParser.js     # Spring XML parser
│   └── dagGenerator.js  # DAG generation logic
├── public/
│   ├── index.html       # Main HTML page
│   ├── styles.css       # Styling
│   └── app.js           # Client-side JavaScript
├── examples/
│   ├── context-jobs.xml
│   ├── context-template.xml
│   └── context-jobs-custom.xml
├── package.json
└── README.md
```

## Technology Stack

- **Backend**: Node.js with built-in HTTP module
- **XML Parsing**: xml2js library
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Visualization**: Custom CSS-based DAG rendering

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for any purpose.

## Screenshots

The visualizer provides:
- Color-coded nodes (Jobs, Steps, Tasklets)
- Hierarchical level-based layout
- Interactive job details
- Execution order validation
- Cycle detection warnings