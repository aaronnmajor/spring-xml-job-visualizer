// Example XML templates
const examples = {
    simple: `<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
       http://www.springframework.org/schema/beans/spring-beans.xsd">

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
</beans>`,

    complex: `<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
       http://www.springframework.org/schema/beans/spring-beans.xsd">

    <bean id="extractTasklet" class="com.example.batch.ExtractTasklet"/>
    
    <bean id="extractStep" class="org.springframework.batch.core.Step">
        <property name="tasklet" ref="extractTasklet"/>
    </bean>
    
    <bean id="validateStep" class="org.springframework.batch.core.Step">
        <property name="previous" ref="extractStep"/>
    </bean>
    
    <bean id="transformStep" class="org.springframework.batch.core.Step">
        <property name="previous" ref="validateStep"/>
    </bean>
    
    <bean id="loadStep" class="org.springframework.batch.core.Step">
        <property name="previous" ref="transformStep"/>
    </bean>
    
    <bean id="notifyStep" class="org.springframework.batch.core.Step">
        <property name="previous" ref="loadStep"/>
    </bean>
    
    <bean id="etlPipelineJob" class="org.springframework.batch.core.Job">
        <property name="steps" ref="notifyStep"/>
    </bean>
</beans>`,

    custom: `<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
       http://www.springframework.org/schema/beans/spring-beans.xsd">

    <bean id="fileReaderTasklet" class="com.example.custom.FileReaderTasklet"/>
    
    <bean id="fileReadStep" class="org.springframework.batch.core.Step">
        <property name="tasklet" ref="fileReaderTasklet"/>
    </bean>
    
    <bean id="dataValidationStep" class="org.springframework.batch.core.Step">
        <property name="dependency" ref="fileReadStep"/>
    </bean>
    
    <bean id="businessRulesStep" class="org.springframework.batch.core.Step">
        <property name="dependency" ref="dataValidationStep"/>
    </bean>
    
    <bean id="reportGenerationStep" class="org.springframework.batch.core.Step">
        <property name="dependency" ref="businessRulesStep"/>
    </bean>
    
    <bean id="customBatchJob" class="org.springframework.batch.core.Job">
        <constructor-arg ref="reportGenerationStep"/>
    </bean>
</beans>`
};

// Tab functionality
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        
        // Update active tab button
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
        
        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
    });
});

// Example buttons
document.querySelectorAll('[data-example]').forEach(button => {
    button.addEventListener('click', () => {
        const exampleName = button.dataset.example;
        document.getElementById('xmlInput').value = examples[exampleName];
        
        // Switch to XML input tab
        document.querySelector('[data-tab="xml-input"]').click();
    });
});

// Visualize button
document.getElementById('visualizeBtn').addEventListener('click', async () => {
    const xmlInput = document.getElementById('xmlInput').value.trim();
    
    if (!xmlInput) {
        showError('Please enter XML content or select an example.');
        return;
    }
    
    hideError();
    
    try {
        const response = await fetch('/api/parse', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ xml: xmlInput })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to parse XML');
        }
        
        displayResults(data);
    } catch (error) {
        showError(error.message);
    }
});

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
}

function hideError() {
    const errorDiv = document.getElementById('error-message');
    errorDiv.classList.remove('show');
}

function displayResults(data) {
    const { dag, executionOrder, levels, hasCycles, cycles } = data;
    
    // Show results section
    document.getElementById('results').style.display = 'block';
    
    // Update info cards
    document.getElementById('jobCount').textContent = dag.nodes.length;
    document.getElementById('hasOrder').textContent = executionOrder ? 'Valid ✓' : 'Invalid ✗';
    document.getElementById('levelCount').textContent = levels.length;
    
    // Show cycle warning if needed
    const cycleWarning = document.getElementById('cycleWarning');
    if (hasCycles) {
        cycleWarning.style.display = 'block';
        document.getElementById('cycleDetails').textContent = 
            `Detected cycles: ${cycles.map(c => c.join(' → ')).join(', ')}`;
    } else {
        cycleWarning.style.display = 'none';
    }
    
    // Visualize DAG
    visualizeDAG(levels, dag.edges);
    
    // Display job details
    displayJobDetails(dag.nodes, dag.edges);
    
    // Scroll to results
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
}

function visualizeDAG(levels, edges) {
    const container = document.getElementById('dagVisualization');
    container.innerHTML = '';
    
    if (levels.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">No jobs found in XML</p>';
        return;
    }
    
    levels.forEach((level, index) => {
        const levelDiv = document.createElement('div');
        levelDiv.className = 'dag-level';
        
        const labelDiv = document.createElement('div');
        labelDiv.className = 'level-label';
        labelDiv.textContent = `Level ${index + 1}`;
        levelDiv.appendChild(labelDiv);
        
        const nodesDiv = document.createElement('div');
        nodesDiv.className = 'dag-nodes';
        
        level.forEach(node => {
            const nodeDiv = document.createElement('div');
            nodeDiv.className = `dag-node ${node.type}`;
            nodeDiv.innerHTML = `
                <div class="node-name">${node.name}</div>
                <div class="node-type">${node.type}</div>
            `;
            nodesDiv.appendChild(nodeDiv);
        });
        
        levelDiv.appendChild(nodesDiv);
        container.appendChild(levelDiv);
        
        // Add arrow between levels
        if (index < levels.length - 1) {
            const arrowDiv = document.createElement('div');
            arrowDiv.className = 'dag-arrow';
            arrowDiv.textContent = '↓';
            container.appendChild(arrowDiv);
        }
    });
}

function displayJobDetails(nodes, edges) {
    const container = document.getElementById('jobDetails');
    container.innerHTML = '';
    
    nodes.forEach(node => {
        const card = document.createElement('div');
        card.className = 'job-detail-card';
        
        // Find dependencies (incoming edges)
        const dependencies = edges
            .filter(e => e.to === node.id)
            .map(e => e.from);
        
        // Find dependents (outgoing edges)
        const dependents = edges
            .filter(e => e.from === node.id)
            .map(e => e.to);
        
        let detailsHTML = `<h3>${node.name}</h3>`;
        
        detailsHTML += `
            <div class="detail-row">
                <div class="label">Type:</div>
                <div class="value">${node.type}</div>
            </div>
        `;
        
        if (node.class) {
            detailsHTML += `
                <div class="detail-row">
                    <div class="label">Class:</div>
                    <div class="value">${node.class}</div>
                </div>
            `;
        }
        
        if (dependencies.length > 0) {
            detailsHTML += `
                <div class="detail-row">
                    <div class="label">Dependencies:</div>
                    <div class="value">
                        <div class="dependencies-list">
                            ${dependencies.map(d => `<span class="dependency-tag">${d}</span>`).join('')}
                        </div>
                    </div>
                </div>
            `;
        }
        
        if (dependents.length > 0) {
            detailsHTML += `
                <div class="detail-row">
                    <div class="label">Dependents:</div>
                    <div class="value">
                        <div class="dependencies-list">
                            ${dependents.map(d => `<span class="dependency-tag">${d}</span>`).join('')}
                        </div>
                    </div>
                </div>
            `;
        }
        
        if (Object.keys(node.properties).length > 0) {
            detailsHTML += `
                <div class="detail-row">
                    <div class="label">Properties:</div>
                    <div class="value">${Object.keys(node.properties).length} property(ies)</div>
                </div>
            `;
        }
        
        card.innerHTML = detailsHTML;
        container.appendChild(card);
    });
}
