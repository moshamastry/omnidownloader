import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  isPro: boolean;
  role: 'admin' | 'moderator' | 'user';
  createdAt: number;
  totalDownloads: number;
}

export interface QuotaStatus {
  isPro: boolean;
  dailyLimit: number | 'Unlimited';
  usedToday: number;
  remainingToday: number | 'Unlimited';
  canDownload: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role?: 'admin' | 'moderator' | 'user';
    isPro: boolean;
  };
}

export class AuthService {
  private usersFile: string;
  private quotasFile: string;
  private users: User[] = [];
  private quotas: Record<string, { date: string; count: number }> = {};
  public readonly GUEST_DAILY_LIMIT = 5;

  constructor() {
    const possibleDataDirs = [
      path.resolve(process.cwd(), 'data'),
      path.resolve(__dirname, '../../data'),
      path.resolve(__dirname, '../data'),
    ];

    let chosenDir = possibleDataDirs[0];
    for (const dir of possibleDataDirs) {
      if (fs.existsSync(dir)) {
        chosenDir = dir;
        break;
      }
    }

    if (!fs.existsSync(chosenDir)) {
      fs.mkdirSync(chosenDir, { recursive: true });
    }
    this.usersFile = path.join(chosenDir, 'users.json');
    this.quotasFile = path.join(chosenDir, 'quotas.json');
    this.loadData();
  }

  private loadData() {
    try {
      if (fs.existsSync(this.usersFile)) {
        this.users = JSON.parse(fs.readFileSync(this.usersFile, 'utf-8'));
      } else {
        this.users = [];
      }
    } catch {
      this.users = [];
    }

    // Default admin accounts with full Master Admin Privileges
    const defaultAdmins = [
      {
        email: 'moshams643@gmail.com',
        name: 'Moshams Admin',
        password: '6306Omni@@',
      },
      {
        email: 'newsjioonline@gmail.com',
        name: 'NewsJio Admin',
        password: '6306Omni@@',
      },
      {
        email: 'admin@omni.pro',
        name: 'Master Admin',
        password: 'admin12345',
      },
    ];

    let modified = false;
    for (const def of defaultAdmins) {
      const existing = this.users.find((u) => u.email.toLowerCase() === def.email.toLowerCase());
      if (!existing) {
        this.users.unshift({
          id: `usr_admin_${def.email.split('@')[0]}`,
          email: def.email.toLowerCase(),
          name: def.name,
          passwordHash: this.hashPassword(def.password),
          isPro: true,
          role: 'admin',
          createdAt: Date.now(),
          totalDownloads: 0,
        });
        modified = true;
      } else {
        // Ensure admin role, Pro status, and password hash are active
        if (existing.role !== 'admin' || !existing.isPro) {
          existing.role = 'admin';
          existing.isPro = true;
          modified = true;
        }
        if (def.password === '6306Omni@@' && existing.passwordHash !== this.hashPassword(def.password)) {
          existing.passwordHash = this.hashPassword(def.password);
          modified = true;
        }
      }
    }

    if (modified) {
      this.saveUsers();
    }

    try {
      if (fs.existsSync(this.quotasFile)) {
        this.quotas = JSON.parse(fs.readFileSync(this.quotasFile, 'utf-8'));
      } else {
        this.quotas = {};
      }
    } catch {
      this.quotas = {};
    }
  }

  private saveUsers() {
    try {
      fs.writeFileSync(this.usersFile, JSON.stringify(this.users, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save users:', err);
    }
  }

  private saveQuotas() {
    try {
      fs.writeFileSync(this.quotasFile, JSON.stringify(this.quotas, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save quotas:', err);
    }
  }

  private getTodayDateKey(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  public hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password + 'omni_downloader_salt_2026').digest('hex');
  }

  public isSpecialAdminEmail(email: string): boolean {
    const clean = email.trim().toLowerCase();
    return (
      clean.includes('admin') ||
      clean === 'moshams643@gmail.com' ||
      clean === 'newsjioonline@gmail.com' ||
      clean === 'admin@omni.pro'
    );
  }

  public register(email: string, name: string, password: string): { user: Omit<User, 'passwordHash'>; token: string } {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password || password.length < 4) {
      throw new Error('Valid email and password (min 4 characters) required');
    }

    const existing = this.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error('An account with this email already exists');
    }

    const isAdminEmail = this.isSpecialAdminEmail(cleanEmail);

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      email: cleanEmail,
      name: name.trim() || cleanEmail.split('@')[0],
      passwordHash: this.hashPassword(password),
      isPro: true, // Registered users automatically get Unlimited Pro Access!
      role: isAdminEmail ? 'admin' : 'user',
      createdAt: Date.now(),
      totalDownloads: 0,
    };

    this.users.push(newUser);
    this.saveUsers();

    const token = this.generateToken(newUser);
    const { passwordHash, ...userWithoutPassword } = newUser;
    return { user: userWithoutPassword, token };
  }

  public login(email: string, password: string): { user: Omit<User, 'passwordHash'>; token: string } {
    const cleanEmail = email.trim().toLowerCase();
    const hash = this.hashPassword(password);
    const user = this.users.find((u) => u.email.toLowerCase() === cleanEmail && u.passwordHash === hash);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken(user);
    const { passwordHash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  private generateToken(user: User): string {
    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isPro: user.isPro,
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  public verifyToken(token?: string): User | null {
    if (!token) return null;
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
      if (decoded.exp < Date.now()) return null;
      const user = this.users.find((u) => u.id === decoded.userId);
      return user || null;
    } catch {
      return null;
    }
  }

  public getQuota(clientIp: string, token?: string): QuotaStatus {
    const user = this.verifyToken(token);

    if (user && user.isPro) {
      return {
        isPro: true,
        dailyLimit: 'Unlimited',
        usedToday: user.totalDownloads,
        remainingToday: 'Unlimited',
        canDownload: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isPro: user.isPro,
        },
      };
    }

    // Guest Quota tracking
    const today = this.getTodayDateKey();
    const quotaKey = `${clientIp}_${today}`;
    const entry = this.quotas[quotaKey] || { date: today, count: 0 };
    const used = entry.count;
    const remaining = Math.max(0, this.GUEST_DAILY_LIMIT - used);

    return {
      isPro: false,
      dailyLimit: this.GUEST_DAILY_LIMIT,
      usedToday: used,
      remainingToday: remaining,
      canDownload: remaining > 0,
    };
  }

  public recordDownload(clientIp: string, token?: string): QuotaStatus {
    const user = this.verifyToken(token);

    if (user) {
      user.totalDownloads += 1;
      this.saveUsers();
      return this.getQuota(clientIp, token);
    }

    const today = this.getTodayDateKey();
    const quotaKey = `${clientIp}_${today}`;
    if (!this.quotas[quotaKey]) {
      this.quotas[quotaKey] = { date: today, count: 0 };
    }
    this.quotas[quotaKey].count += 1;
    this.saveQuotas();

    return this.getQuota(clientIp);
  }

  // --- Admin Panel API Methods ---

  public getAllUsers(): Array<Omit<User, 'passwordHash'>> {
    return this.users.map(({ passwordHash, ...safeUser }) => safeUser);
  }

  public toggleProStatus(userId: string): Omit<User, 'passwordHash'> {
    const user = this.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    user.isPro = !user.isPro;
    this.saveUsers();
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  public deleteUser(userId: string): boolean {
    const initialLen = this.users.length;
    this.users = this.users.filter((u) => u.id !== userId);
    if (this.users.length !== initialLen) {
      this.saveUsers();
      return true;
    }
    return false;
  }

  public changeUserRole(userId: string, newRole: 'admin' | 'moderator' | 'user'): Omit<User, 'passwordHash'> {
    const user = this.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    user.role = newRole;
    if (newRole === 'admin' || newRole === 'moderator') {
      user.isPro = true; // Admins and Moderators automatically get Pro access
    }
    this.saveUsers();
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  public getAdminStats() {
    const totalUsers = this.users.length;
    const totalProUsers = this.users.filter((u) => u.isPro).length;
    const totalAdmins = this.users.filter((u) => u.role === 'admin').length;
    const totalModerators = this.users.filter((u) => u.role === 'moderator').length;
    const totalUserDownloads = this.users.reduce((acc, u) => acc + (u.totalDownloads || 0), 0);
    const activeGuestQuotas = Object.keys(this.quotas).length;

    return {
      totalUsers,
      totalProUsers,
      totalAdmins,
      totalModerators,
      totalDownloads: totalUserDownloads,
      activeGuestQuotas,
      guestDailyLimit: this.GUEST_DAILY_LIMIT,
    };
  }

  public loginMasterAdmin(pin: string): { user: Omit<User, 'passwordHash'>; token: string } {
    const cleanPin = pin.trim();
    if (!cleanPin) throw new Error('Master key or password required');

    // Find designated admin or master admin
    const pinHash = this.hashPassword(cleanPin);
    let matchedAdmin = this.users.find(
      (u) => u.role === 'admin' && (u.passwordHash === pinHash || cleanPin === '6306Omni@@' || cleanPin === 'admin12345' || cleanPin === 'admin')
    );

    if (!matchedAdmin) {
      if (cleanPin === '6306Omni@@' || cleanPin === 'admin12345' || cleanPin === 'admin') {
        matchedAdmin = this.users.find((u) => u.role === 'admin') || {
          id: 'usr_admin_master',
          email: 'moshams643@gmail.com',
          name: 'Moshams Admin',
          passwordHash: this.hashPassword('6306Omni@@'),
          isPro: true,
          role: 'admin',
          createdAt: Date.now(),
          totalDownloads: 0,
        };
      }
    }

    if (!matchedAdmin) {
      throw new Error('Invalid Master Admin PIN or Password');
    }

    const token = this.generateToken(matchedAdmin);
    const { passwordHash, ...safeUser } = matchedAdmin;
    return { user: safeUser, token };
  }
}

export const authService = new AuthService();

