#!/usr/bin/env node
/**
 * Equate Site - HTML Validation & Link Checker
 * Tests all HTML files for common issues, broken links, and consistency
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let errorCount = 0;
let warningCount = 0;
let testCount = 0;

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function error(message) {
  errorCount++;
  log(`  ✗ ${message}`, colors.red);
}

function warning(message) {
  warningCount++;
  log(`  ⚠ ${message}`, colors.yellow);
}

function success(message) {
  log(`  ✓ ${message}`, colors.green);
}

function info(message) {
  log(`${colors.cyan}${message}${colors.reset}`);
}

// Get all HTML files
function getAllHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip .git, .github, .idea, node_modules
      if (!file.startsWith('.') && file !== 'node_modules') {
        getAllHtmlFiles(filePath, fileList);
      }
    } else if (file.endsWith('.html')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Extract all links from HTML content
function extractLinks(content) {
  const linkPattern = /(?:href|src)=["']([^"']+)["']/g;
  const links = [];
  let match;
  
  while ((match = linkPattern.exec(content)) !== null) {
    links.push(match[1]);
  }
  
  return links;
}

// Extract all IDs from HTML content
function extractIds(content) {
  const idPattern = /id=["']([^"']+)["']/g;
  const ids = [];
  let match;
  
  while ((match = idPattern.exec(content)) !== null) {
    ids.push(match[1]);
  }
  
  return ids;
}

// Check if a local file exists
function checkLocalFile(filePath, baseDir) {
  // Remove query strings and anchors
  const cleanPath = filePath.split('?')[0].split('#')[0];
  
  // Skip external URLs
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://') || cleanPath.startsWith('//')) {
    return true;
  }
  
  // Skip data URLs and mailto
  if (cleanPath.startsWith('data:') || cleanPath.startsWith('mailto:') || cleanPath === '#') {
    return true;
  }
  
  // Convert to absolute path
  let absolutePath;
  if (cleanPath.startsWith('/')) {
    absolutePath = path.join(process.cwd(), cleanPath);
  } else {
    absolutePath = path.join(baseDir, cleanPath);
  }
  
  return fs.existsSync(absolutePath);
}

// Test individual HTML file
function testHtmlFile(filePath) {
  testCount++;
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.relative(process.cwd(), filePath);
  const baseDir = path.dirname(filePath);
  
  log(`\n${colors.bright}Testing: ${fileName}${colors.reset}`);
  
  // Test 1: Check for basic HTML structure
  if (!content.includes('<!DOCTYPE html>')) {
    error('Missing DOCTYPE declaration');
  }
  if (!content.includes('<html')) {
    error('Missing <html> tag');
  }
  if (!content.includes('<head>')) {
    error('Missing <head> tag');
  }
  if (!content.includes('<body')) {
    error('Missing <body> tag');
  }
  
  // Test 2: Check for required meta tags
  if (!content.includes('<meta charset=')) {
    error('Missing charset meta tag');
  }
  if (!content.includes('viewport')) {
    error('Missing viewport meta tag');
  }
  if (!content.includes('<title>')) {
    error('Missing <title> tag');
  }
  
  // Test 3: Check for invalid class names
  if (content.includes('class=""')) {
    warning('Empty class attribute found');
  }
  const invalidClassPattern = /class="[^"]*\s[a-z]\s/g;
  if (invalidClassPattern.test(content)) {
    error('Found invalid CSS class with single letter surrounded by spaces');
  }
  
  // Test 4: Check all links
  const links = extractLinks(content);
  const internalLinks = links.filter(link => 
    !link.startsWith('http://') && 
    !link.startsWith('https://') && 
    !link.startsWith('//') &&
    !link.startsWith('data:') &&
    !link.startsWith('mailto:') &&
    link !== '#'
  );
  
  internalLinks.forEach(link => {
    const [filePart, anchor] = link.split('#');
    
    // Check file existence
    if (filePart && !checkLocalFile(filePart, baseDir)) {
      error(`Broken link: ${link}`);
    }
    
    // Check anchor if it's linking to current file or an anchor-only link
    if (anchor && (!filePart || filePart === fileName)) {
      const ids = extractIds(content);
      if (!ids.includes(anchor)) {
        error(`Broken anchor: #${anchor}`);
      }
    }
  });
  
  // Test 5: Check for duplicate IDs
  const ids = extractIds(content);
  const idCounts = {};
  ids.forEach(id => {
    idCounts[id] = (idCounts[id] || 0) + 1;
  });
  Object.keys(idCounts).forEach(id => {
    if (idCounts[id] > 1) {
      error(`Duplicate ID found: ${id} (appears ${idCounts[id]} times)`);
    }
  });
  
  // Test 6: Check for required scripts in docs pages with full layout (pages/docs/*.html; exclude redirect docs.html)
  const isDocsLayoutPage = (fileName.includes(path.sep + 'docs' + path.sep) &&
    content.includes('id="docs-sidebar"'));
  if (isDocsLayoutPage) {
    if (!content.includes('js/docs.js')) {
      error(fileName + ' missing required docs.js script');
    }
    if (!content.includes('js/nav.js')) {
      error(fileName + ' missing required nav.js script');
    }
    if (!content.includes('id="sidebar-toggle"')) {
      error(fileName + ' missing sidebar-toggle button');
    }
    if (!content.includes('id="docs-sidebar"')) {
      error(fileName + ' missing docs-sidebar element');
    }
  }
  
  // Test 7: Check for consistent footer links in /pages/ directory
  if (fileName.includes('pages\\') || fileName.includes('pages/')) {
    const footerPattern = /<ul class="footer-links">([\s\S]*?)<\/ul>/;
    const footerMatch = content.match(footerPattern);
    
    if (footerMatch) {
      const footerContent = footerMatch[1];
      const relativeLinks = ['privacy.html', 'terms.html', 'security.html', 'contact.html'];
      
      relativeLinks.forEach(link => {
        if (footerContent.includes(`href="${link}"`)) {
          error(`Footer contains relative link "${link}" - should be "/pages/${link}"`);
        }
      });
    }
  }
  
  // Test 8: Check navigation consistency in /pages/ directory
  if (fileName.includes('pages\\') || fileName.includes('pages/')) {
    if (content.includes('href="pricing.html"') && !content.includes('href="/pages/pricing.html"')) {
      error('Navigation contains relative link "pricing.html" - should be "/pages/pricing.html"');
    }
    if (content.includes('href="docs.html"') && !content.includes('href="/pages/docs.html"') && !content.includes('href="/pages/docs/"')) {
      error('Navigation contains relative link "docs.html" - should be "/pages/docs/"');
    }
    if (content.includes('href="signin.html"') && !content.includes('href="/pages/signin.html"')) {
      error('Navigation contains relative link "signin.html" - should be "/pages/signin.html"');
    }
  }
  
  // If no errors found for this file
  if (errorCount === 0 && warningCount === 0) {
    success('All checks passed');
  }
}

// Main test runner
function runTests() {
  log(`${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════╗${colors.reset}`);
  log(`${colors.bright}${colors.cyan}║     Equate Site - HTML Validation & Link Checker      ║${colors.reset}`);
  log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════════════════╝${colors.reset}\n`);
  
  const htmlFiles = getAllHtmlFiles(process.cwd());
  
  info(`Found ${htmlFiles.length} HTML files to test\n`);
  
  htmlFiles.forEach(file => {
    testHtmlFile(file);
  });
  
  // Summary
  log(`\n${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}`);
  log(`${colors.bright}Test Summary:${colors.reset}`);
  log(`  Files tested: ${testCount}`);
  log(`  ${colors.green}✓ Passed${colors.reset}`);
  
  if (warningCount > 0) {
    log(`  ${colors.yellow}⚠ Warnings: ${warningCount}${colors.reset}`);
  }
  
  if (errorCount > 0) {
    log(`  ${colors.red}✗ Errors: ${errorCount}${colors.reset}`);
    log(`${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}\n`);
    process.exit(1);
  } else {
    log(`${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}\n`);
    log(`${colors.green}${colors.bright}All tests passed! ✓${colors.reset}\n`);
  }
}

// Run tests
runTests();
