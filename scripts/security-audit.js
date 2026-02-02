#!/usr/bin/env node

/**
 * Script de Auditoria de Segurança de Dependências
 *
 * Executa npm audit e gera relatórios estruturados.
 * Pode ser executado manualmente ou via CI/CD.
 *
 * Uso:
 *   node scripts/security-audit.js [--fix] [--json] [--fail-on=critical|high|moderate]
 *
 * Exemplos:
 *   node scripts/security-audit.js
 *   node scripts/security-audit.js --fail-on=high
 *   node scripts/security-audit.js --fix
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(` ${title}`, 'cyan');
  console.log('='.repeat(60) + '\n');
}

// Parse argumentos
const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');
const jsonOutput = args.includes('--json');
const failOnArg = args.find(a => a.startsWith('--fail-on='));
const failOnLevel = failOnArg ? failOnArg.split('=')[1] : null;

// Níveis de severidade (ordenados por gravidade)
const severityLevels = ['info', 'low', 'moderate', 'high', 'critical'];

function getSeverityWeight(severity) {
  return severityLevels.indexOf(severity.toLowerCase());
}

function shouldFailOn(severity, failLevel) {
  if (!failLevel) return false;
  return getSeverityWeight(severity) >= getSeverityWeight(failLevel);
}

async function runAudit() {
  logSection('AUDITORIA DE SEGURANÇA DE DEPENDÊNCIAS');

  const startTime = Date.now();
  let auditResult;
  let exitCode = 0;

  try {
    // Executa npm audit em formato JSON
    const output = execSync('npm audit --json 2>/dev/null', {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024 // 10MB
    });
    auditResult = JSON.parse(output);
  } catch (error) {
    // npm audit retorna código de erro se encontrar vulnerabilidades
    if (error.stdout) {
      try {
        auditResult = JSON.parse(error.stdout);
      } catch {
        log('Erro ao parsear output do npm audit', 'red');
        process.exit(1);
      }
    } else {
      log('Erro ao executar npm audit', 'red');
      console.error(error.message);
      process.exit(1);
    }
  }

  // Processa resultados
  const { vulnerabilities, metadata } = auditResult;

  if (!vulnerabilities) {
    log('✓ Nenhuma vulnerabilidade encontrada!', 'green');
    process.exit(0);
  }

  // Conta vulnerabilidades por severidade
  const counts = {
    critical: 0,
    high: 0,
    moderate: 0,
    low: 0,
    info: 0,
    total: 0
  };

  const vulnDetails = [];

  for (const [name, vuln] of Object.entries(vulnerabilities)) {
    if (vuln.severity) {
      counts[vuln.severity] = (counts[vuln.severity] || 0) + 1;
      counts.total++;

      vulnDetails.push({
        name,
        severity: vuln.severity,
        isDirect: vuln.isDirect,
        via: vuln.via,
        range: vuln.range,
        fixAvailable: vuln.fixAvailable
      });
    }
  }

  // Output JSON se solicitado
  if (jsonOutput) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: counts,
      vulnerabilities: vulnDetails,
      metadata: {
        dependencies: metadata?.dependencies || 0,
        devDependencies: metadata?.devDependencies || 0,
        totalDependencies: metadata?.totalDependencies || 0
      }
    };
    console.log(JSON.stringify(report, null, 2));

    // Salva relatório
    const reportsDir = path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportFile = path.join(reportsDir, `security-audit-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    process.exit(counts.critical > 0 || counts.high > 0 ? 1 : 0);
  }

  // Output visual
  log('📊 Resumo de Vulnerabilidades:', 'bold');
  console.log('');

  if (counts.critical > 0) {
    log(`   🔴 Críticas:    ${counts.critical}`, 'red');
  }
  if (counts.high > 0) {
    log(`   🟠 Altas:       ${counts.high}`, 'yellow');
  }
  if (counts.moderate > 0) {
    log(`   🟡 Moderadas:   ${counts.moderate}`, 'yellow');
  }
  if (counts.low > 0) {
    log(`   🟢 Baixas:      ${counts.low}`, 'green');
  }
  if (counts.info > 0) {
    log(`   ⚪ Info:        ${counts.info}`, 'white');
  }

  console.log('');
  log(`   Total: ${counts.total} vulnerabilidades`, 'bold');
  console.log('');

  // Lista detalhada
  if (vulnDetails.length > 0) {
    logSection('DETALHES DAS VULNERABILIDADES');

    // Ordena por severidade (mais graves primeiro)
    vulnDetails.sort((a, b) => getSeverityWeight(b.severity) - getSeverityWeight(a.severity));

    for (const vuln of vulnDetails.slice(0, 20)) { // Limita a 20 para não poluir output
      const severityColors = {
        critical: 'red',
        high: 'yellow',
        moderate: 'yellow',
        low: 'green',
        info: 'white'
      };

      const color = severityColors[vuln.severity] || 'white';
      const icon = vuln.fixAvailable ? '✓' : '✗';
      const fixStatus = vuln.fixAvailable ? 'fix disponível' : 'sem fix automático';

      log(`• ${vuln.name}`, color);
      log(`  Severidade: ${vuln.severity.toUpperCase()} | ${icon} ${fixStatus}`, 'white');

      if (vuln.via && Array.isArray(vuln.via)) {
        const viaNames = vuln.via
          .filter(v => typeof v === 'string')
          .join(', ');
        if (viaNames) {
          log(`  Via: ${viaNames}`, 'white');
        }
      }
      console.log('');
    }

    if (vulnDetails.length > 20) {
      log(`... e mais ${vulnDetails.length - 20} vulnerabilidades`, 'white');
    }
  }

  // Recomendações
  logSection('RECOMENDAÇÕES');

  if (counts.critical > 0 || counts.high > 0) {
    log('⚠️  AÇÃO NECESSÁRIA: Existem vulnerabilidades críticas/altas!', 'red');
    console.log('');
    log('Comandos sugeridos:', 'white');
    log('  npm audit fix              # Corrige automaticamente (seguro)', 'cyan');
    log('  npm audit fix --force      # Corrige com breaking changes', 'cyan');
    log('  npm update <pacote>        # Atualiza pacote específico', 'cyan');
    console.log('');
  }

  // Verifica se são apenas devDependencies
  const devOnlyVulns = vulnDetails.filter(v =>
    v.name.includes('eslint') ||
    v.name.includes('jest') ||
    v.name.includes('typescript') ||
    v.name.includes('prettier') ||
    v.name.includes('@types/')
  );

  if (devOnlyVulns.length === vulnDetails.length) {
    log('ℹ️  Todas as vulnerabilidades são em devDependencies', 'blue');
    log('   Estas não afetam o código em produção.', 'white');
    console.log('');
  }

  // Tenta fix automático se solicitado
  if (shouldFix) {
    logSection('EXECUTANDO CORREÇÕES AUTOMÁTICAS');

    try {
      const fixOutput = execSync('npm audit fix', { encoding: 'utf-8' });
      log(fixOutput, 'green');
      log('✓ Correções aplicadas com sucesso!', 'green');
    } catch (error) {
      log('Algumas correções não puderam ser aplicadas automaticamente.', 'yellow');
      log('Execute `npm audit fix --force` para forçar (pode ter breaking changes).', 'white');
    }
  }

  // Determina código de saída
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('');
  log(`⏱️  Auditoria concluída em ${elapsed}s`, 'white');

  if (failOnLevel) {
    for (const severity of ['critical', 'high', 'moderate', 'low']) {
      if (counts[severity] > 0 && shouldFailOn(severity, failOnLevel)) {
        log(`\n❌ Falha: Encontradas ${counts[severity]} vulnerabilidades ${severity}`, 'red');
        exitCode = 1;
        break;
      }
    }
  } else if (counts.critical > 0) {
    exitCode = 1;
  }

  if (exitCode === 0) {
    log('\n✅ Auditoria passou!', 'green');
  }

  process.exit(exitCode);
}

// Executa
runAudit().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
