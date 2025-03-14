// Dados fictícios dos jogadores de vôlei (todos masculinos)
const players = [
    { name: "Marcos Vinícius", sex: "Masculino", height: 190, jump: 70, attacks: 65 },
    { name: "Rafael Borges", sex: "Masculino", height: 185, jump: 85, attacks: 80 },
    { name: "Thiago Lopes", sex: "Masculino", height: 195, jump: 60, attacks: 70 },
    { name: "Lucas Almeida", sex: "Masculino", height: 180, jump: 75, attacks: 60 },
    { name: "Pedro Henrique", sex: "Masculino", height: 200, jump: 65, attacks: 75 },
    { name: "João Victor", sex: "Masculino", height: 188, jump: 80, attacks: 85 }
];

// Populando a tabela
function populateTable() {
    const tbody = document.getElementById("data-body");
    tbody.innerHTML = "";
    players.forEach(player => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${player.name}</td>
            <td>${player.sex}</td>
            <td>${player.height}</td>
            <td>${player.jump}</td>
            <td>${player.attacks}</td>
        `;
        tbody.appendChild(row);
    });
}

// Distância Euclidiana com normalização
function euclideanDistance(point1, point2) {
    let sum = 0;
    for (let i = 0; i < point1.length; i++) {
        sum += ((point1[i] - point2[i]) / 100) ** 2; // Normaliza pra evitar escalas grandes
    }
    return Math.sqrt(sum);
}

// K-Means com centroides fixos iniciais
function kMeans(data, k, maxIterations = 50) {
    let centroids = [
        [180, 75, 60], // Levantador
        [195, 80, 85], // Oposto
        [200, 65, 70]  // Central
    ].slice(0, k);

    let clusters = new Array(data.length);
    let iteration = 0;

    while (iteration < maxIterations) {
        let changed = false;
        for (let i = 0; i < data.length; i++) {
            let minDistance = Infinity;
            let clusterIndex = 0;
            for (let j = 0; j < k; j++) {
                let distance = euclideanDistance(data[i], centroids[j]);
                if (distance < minDistance) {
                    minDistance = distance;
                    clusterIndex = j;
                }
            }
            if (clusters[i] !== clusterIndex) {
                clusters[i] = clusterIndex;
                changed = true;
            }
        }

        if (!changed) break;

        let newCentroids = Array(k).fill().map(() => Array(data[0].length).fill(0));
        let counts = Array(k).fill(0);
        for (let i = 0; i < data.length; i++) {
            let cluster = clusters[i];
            for (let j = 0; j < data[0].length; j++) {
                newCentroids[cluster][j] += data[i][j];
            }
            counts[cluster]++;
        }
        for (let j = 0; j < k; j++) {
            if (counts[j] > 0) {
                for (let dim = 0; dim < data[0].length; dim++) {
                    newCentroids[j][dim] /= counts[j];
                }
            }
        }
        centroids = newCentroids;
        iteration++;
    }
    return { clusters, centroids, iterations: iteration };
}

// Posição no Time (Não Supervisionado)
function runUnsupervised() {
    const data = players.map(p => [p.height, p.jump, p.attacks]);
    const { clusters, centroids, iterations } = kMeans(data, 3);

    let resultHtml = `<h3>Posições:</h3><p>Iterações: ${iterations}</p><ul>`;
    players.forEach((player, i) => {
        let position = clusters[i] === 0 ? "Levantador" : clusters[i] === 1 ? "Oposto" : "Central";
        resultHtml += `<li>${player.name}: ${position}</li>`;
    });
    resultHtml += `</ul>`;
    document.getElementById("unsupervised-results").innerHTML = resultHtml;

    const ctx = document.getElementById("unsupervised-chart").getContext("2d");
    new Chart(ctx, {
        type: "scatter",
        data: {
            datasets: [{
                label: "Jogadores",
                data: players.map((p, i) => ({ x: p.jump, y: p.attacks })),
                backgroundColor: clusters.map(c => ["#ffca28", "#e91e63", "#00bcd4"][c]),
                pointRadius: 5
            }]
        },
        options: {
            scales: {
                x: { title: { display: true, text: "Impulsão (cm)" } },
                y: { title: { display: true, text: "Ataques Certos (%)" } }
            }
        }
    });
}

// Regressão Linear com ajuste logarítmico
function linearRegression(x, y) {
    const n = x.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
        let logX = Math.log(x[i] + 1); // Ajuste logarítmico
        sumX += logX;
        sumY += y[i];
        sumXY += logX * y[i];
        sumXX += logX * logX;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return { slope, intercept };
}

// Nível do Time (Supervisado)
function runSupervised() {
    const x = players.map(p => p.jump);
    const y = players.map(p => p.attacks * 0.7 + p.height * 0.3); // Nova fórmula de desempenho
    const { slope, intercept } = linearRegression(x, y);

    let resultHtml = `<h3>Nível:</h3><p>Equação: Desempenho = ${slope.toFixed(2)} × ln(Impulsão + 1) + ${intercept.toFixed(2)}</p>`;
    resultHtml += `<p>Previsões:</p><ul>`;
    const pred70 = slope * Math.log(70 + 1) + intercept;
    const pred85 = slope * Math.log(85 + 1) + intercept;
    resultHtml += `<li>Impulsão 70 cm: ${pred70.toFixed(2)} (${pred70 > 90 ? "Elite" : pred70 > 70 ? "Intermediário" : "Base"})</li>`;
    resultHtml += `<li>Impulsão 85 cm: ${pred85.toFixed(2)} (${pred85 > 90 ? "Elite" : pred85 > 70 ? "Intermediário" : "Base"})</li>`;
    resultHtml += `</ul>`;
    document.getElementById("supervised-results").innerHTML = resultHtml;

    const ctx = document.getElementById("supervised-chart").getContext("2d");
    new Chart(ctx, {
        type: "scatter",
        data: {
            datasets: [
                {
                    label: "Desempenho",
                    data: players.map(p => ({ x: p.jump, y: p.attacks * 0.7 + p.height * 0.3 })),
                    backgroundColor: "#e91e63",
                    pointRadius: 5
                },
                {
                    label: "Regressão",
                    type: "line",
                    data: x.map(xi => ({ x: xi, y: slope * Math.log(xi + 1) + intercept })),
                    borderColor: "#00bcd4",
                    borderWidth: 2,
                    fill: false
                }
            ]
        },
        options: {
            scales: {
                x: { title: { display: true, text: "Impulsão (cm)" } },
                y: { title: { display: true, text: "Desempenho" } }
            }
        }
    });
}

// Previsão de Novo Jogador
function predictNewPlayer() {
    const height = parseFloat(document.getElementById("new-height").value) || 0;
    const jump = parseFloat(document.getElementById("new-jump").value) || 0;
    const attacks = parseFloat(document.getElementById("new-attacks").value) || 0;
    const x = players.map(p => p.jump);
    const y = players.map(p => p.attacks * 0.7 + p.height * 0.3);
    const { slope, intercept } = linearRegression(x, y);

    const predictedPerformance = slope * Math.log(jump + 1) + intercept;
    const data = players.map(p => [p.height, p.jump, p.attacks]);
    const newDataPoint = [height, jump, attacks];
    const combinedData = [...data, newDataPoint];
    const { clusters } = kMeans(combinedData, 3);

    let resultHtml = `<h3>Novo Jogador:</h3>`;
    resultHtml += `<p>Altura: ${height} cm, Impulsão: ${jump} cm, Ataques: ${attacks}%</p>`;
    resultHtml += `<p>Desempenho: ${predictedPerformance.toFixed(2)} (${predictedPerformance > 90 ? "Elite" : predictedPerformance > 70 ? "Intermediário" : "Base"})</p>`;
    resultHtml += `<p>Posição: ${clusters[clusters.length - 1] === 0 ? "Levantador" : clusters[clusters.length - 1] === 1 ? "Oposto" : "Central"}</p>`;
    document.getElementById("prediction-results").innerHTML = resultHtml;
}

// Inicialização
populateTable();