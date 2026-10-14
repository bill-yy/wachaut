#!/usr/bin/env node
/**
 * Admin user management CLI.
 *
 * Usage:
 *   node dist/admin/setup.js create-user
 *     Interactive: prompts for username + password + role.
 *
 *   node dist/admin/setup.js list-users
 *     Lists all admin users.
 *
 *   node dist/admin/setup.js reset-password <username>
 *     Interactive: prompts for new password.
 *
 * Every action is written to the audit log as user "cli".
 */

import * as readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import {
  createUser, listUsers, changePassword, findUserByUsername, bootstrapAdmin,
  isValidUsername, isValidPassword, MIN_PASSWORD_LENGTH, auditLog,
} from './auth.js';
import { db } from '../db.js';

function cliAudit(action: string): void {
  auditLog(null, 'cli', action, 'system', '??');
}

async function prompt(rl: readline.Interface, question: string, hidden = false): Promise<string> {
  if (hidden) {
    // Read password without echo (basic approach for terminal).
    stdout.write(question);
    return new Promise((resolve) => {
      stdin.setRawMode(true);
      stdin.resume();
      stdin.setEncoding('utf8');
      let input = '';
      stdin.on('data', (chunk) => {
        const char = chunk.toString();
        if (char === '\r' || char === '\n') {
          stdin.setRawMode(false);
          stdin.removeAllListeners('data');
          stdout.write('\n');
          resolve(input);
        } else if (char === '\u0003') {
          process.exit(1);
        } else {
          input += char;
          stdout.write('*');
        }
      });
    });
  }
  return rl.question(question);
}

async function main() {
  const command = process.argv[2];
  const rl = readline.createInterface({ input: stdin, output: stdout });

  if (command === 'create-user') {
    const username = (await prompt(rl, 'Username: ')).trim();
    if (!isValidUsername(username)) {
      console.error(`Invalid username (3-32 chars: letters, numbers, . _ -)`);
      process.exit(1);
    }
    const password = await prompt(rl, `Password (min ${MIN_PASSWORD_LENGTH} chars): `, true);
    if (!isValidPassword(password)) {
      console.error(`Password must be ${MIN_PASSWORD_LENGTH}-128 characters`);
      process.exit(1);
    }
    const roleInput = (await prompt(rl, 'Role (admin/superadmin) [admin]: ')).trim();
    const role = roleInput === 'superadmin' ? 'superadmin' : 'admin';

    try {
      const user = createUser(username, password, role);
      cliAudit(`create_user:${user.username}`);
      console.log(`\n✓ Created ${role} "${user.username}" (id: ${user.id})`);
    } catch (err: any) {
      if (err?.message?.includes('UNIQUE')) {
        console.error('Error: username already exists');
      } else {
        throw err;
      }
    }
  } else if (command === 'list-users') {
    const users = listUsers();
    if (users.length === 0) {
      console.log('No admin users found. Run: node dist/admin/setup.js create-user');
    } else {
      console.log('\nAdmin users:');
      for (const u of users) {
        const status = u.active ? '✓' : '✗';
        const totp = u.totp_enabled ? ' [2FA]' : '';
        console.log(`  ${status} ${u.username.padEnd(20)} ${u.role.padEnd(12)} created: ${u.created_at}  last_login: ${u.last_login || 'never'}${totp}`);
      }
    }
  } else if (command === 'reset-password') {
    const username = process.argv[3];
    if (!username) { console.error('Usage: reset-password <username>'); process.exit(1); }
    const user = findUserByUsername(username);
    if (!user) { console.error('User not found'); process.exit(1); }
    const password = await prompt(rl, `New password (min ${MIN_PASSWORD_LENGTH} chars): `, true);
    if (!isValidPassword(password)) {
      console.error(`Password must be ${MIN_PASSWORD_LENGTH}-128 characters`);
      process.exit(1);
    }
    changePassword(user.id, password); // bumps token_version — kills the user's live sessions
    cliAudit(`reset_password:${user.username}`);
    console.log(`\n✓ Password changed for "${user.username}" (existing sessions invalidated)`);
  } else if (command === 'bootstrap') {
    bootstrapAdmin();
    console.log('Bootstrap check complete.');
  } else {
    console.log('Usage:');
    console.log('  node dist/admin/setup.js create-user       Create a new admin user');
    console.log('  node dist/admin/setup.js list-users        List all admin users');
    console.log('  node dist/admin/setup.js reset-password <username>');
    console.log('  node dist/admin/setup.js bootstrap         Bootstrap first superadmin');
  }

  rl.close();
  db.close();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
