import { useEffect, useState, useRef } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import axios from 'axios';
import {
  LayoutDashboard,
  Package,
  Clock,
  Settings,
  Plus,
  Search,
  X,
  ShieldCheck,
  Trash2,
  Pencil,
  Upload,
  Image as ImageIcon,
  LogOut,
  User as UserIcon,
  Lock,
  Mail,
  AlertCircle,
  Eye,
} from 'lucide-react';

type User = {
  id: string;
  name: string;
  email: string;
};

type Product = {
  _id: string;
  name: string;
  category: string;
  purchaseDate: string;
  warrantyMonths: number;
  icon: string;
  image?: string;
};

const BASE_URL = 'http://localhost:5000';
const API_URL = `${BASE_URL}/api/products`;
const AUTH_URL = `${BASE_URL}/api/auth`;
const UPLOAD_URL = `${BASE_URL}/api/upload`;

function getExpiryDate(purchaseDate: string, warrantyMonths: number) {
  const date = new Date(`${purchaseDate}T12:00:00`);
  date.setMonth(date.getMonth() + warrantyMonths);
  return date;
}

function getWarrantyStatus(expiryDate: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysLeft = Math.ceil(
    (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysLeft < 0) return 'Expired';
  if (daysLeft <= 30) return 'Expiring soon';
  return 'Active';
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function App() {
  // Auth state
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('proofkeep_token')
  );
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('proofkeep_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState('12');
  const [error, setError] = useState('');
  const [apiError, setApiError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Device Image State
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [previewModalImage, setPreviewModalImage] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auth header config
  const getAuthHeaders = () => ({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Check auth session and fetch user if token exists
  useEffect(() => {
    async function verifyAuth() {
      if (!token) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get<{ user: User }>(
          `${AUTH_URL}/me`,
          getAuthHeaders()
        );
        setCurrentUser(response.data.user);
        localStorage.setItem('proofkeep_user', JSON.stringify(response.data.user));
      } catch {
        // Token invalid or expired
        setToken(null);
        setCurrentUser(null);
        localStorage.removeItem('proofkeep_token');
        localStorage.removeItem('proofkeep_user');
      } finally {
        setLoading(false);
      }
    }

    verifyAuth();
  }, [token]);

  // Load saved products from MongoDB when authenticated
  useEffect(() => {
    if (!token) {
      setProducts([]);
      return;
    }

    async function loadProducts() {
      try {
        setLoading(true);
        const response = await axios.get<Product[]>(API_URL, getAuthHeaders());
        setProducts(response.data);
        setApiError('');
      } catch {
        setApiError('Could not load products. Please check if backend is running.');
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [token]);

  // Handle Authentication submit (Sign In / Register)
  async function handleAuth(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMode === 'register') {
        if (!authName.trim()) {
          setAuthError('Please enter your full name.');
          setAuthLoading(false);
          return;
        }

        const res = await axios.post<{ token: string; user: User }>(
          `${AUTH_URL}/register`,
          {
            name: authName.trim(),
            email: authEmail.trim(),
            password: authPassword,
          }
        );

        setToken(res.data.token);
        setCurrentUser(res.data.user);
        localStorage.setItem('proofkeep_token', res.data.token);
        localStorage.setItem('proofkeep_user', JSON.stringify(res.data.user));
      } else {
        const res = await axios.post<{ token: string; user: User }>(
          `${AUTH_URL}/login`,
          {
            email: authEmail.trim(),
            password: authPassword,
          }
        );

        setToken(res.data.token);
        setCurrentUser(res.data.user);
        localStorage.setItem('proofkeep_token', res.data.token);
        localStorage.setItem('proofkeep_user', JSON.stringify(res.data.user));
      }

      setAuthName('');
      setAuthEmail('');
      setAuthPassword('');
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setAuthError(err.response.data.message);
      } else {
        setAuthError('Authentication failed. Please check your credentials.');
      }
    } finally {
      setAuthLoading(false);
    }
  }

  // Handle Logout
  function handleLogout() {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('proofkeep_token');
    localStorage.removeItem('proofkeep_user');
    setProducts([]);
  }

  // Handle local file selection for device image
  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file (PNG, JPG, WEBP, etc.).');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setImageUrl('');
    }
  }

  // Clear chosen image
  function handleClearImage() {
    setImageFile(null);
    setImagePreview('');
    setImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  // Save or Update Product
  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setApiError('');

    if (!name.trim() || !purchaseDate) {
      setError('Please enter a product name and purchase date.');
      return;
    }

    if (new Date(`${purchaseDate}T00:00:00`) > new Date()) {
      setError('Purchase date cannot be in the future.');
      return;
    }

    const icon =
      category === 'Electronics'
        ? '💻'
        : category === 'Accessories'
          ? '🎧'
          : category === 'Home appliances'
            ? '🏠'
            : '📦';

    setSaving(true);

    try {
      let finalImageUrl = imageUrl.trim();

      // If user uploaded a new image file, send to backend /api/upload first
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);

        const uploadRes = await axios.post<{ imageUrl: string }>(
          UPLOAD_URL,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`,
            },
          }
        );
        finalImageUrl = uploadRes.data.imageUrl;
      }

      const payload = {
        name: name.trim(),
        category,
        purchaseDate,
        warrantyMonths: Number(warrantyMonths),
        icon,
        image: finalImageUrl,
      };

      if (editingId) {
        const response = await axios.put<Product>(
          `${API_URL}/${editingId}`,
          payload,
          getAuthHeaders()
        );

        setProducts((current) =>
          current.map((product) =>
            product._id === editingId ? response.data : product
          )
        );
      } else {
        const response = await axios.post<Product>(
          API_URL,
          payload,
          getAuthHeaders()
        );
        setProducts((current) => [...current, response.data]);
      }

      // Reset form
      setName('');
      setCategory('Electronics');
      setPurchaseDate('');
      setWarrantyMonths('12');
      handleClearImage();
      setEditingId(null);
      setShowForm(false);
    } catch {
      setError('Could not save the product. Please check your connection.');
    } finally {
      setSaving(false);
    }
  }

  function editProduct(product: Product) {
    setEditingId(product._id);
    setName(product.name);
    setCategory(product.category);
    setPurchaseDate(product.purchaseDate);
    setWarrantyMonths(String(product.warrantyMonths));
    setImageUrl(product.image || '');
    setImagePreview(product.image || '');
    setImageFile(null);
    setImageInputMode(product.image?.startsWith('http') ? 'url' : 'upload');
    setError('');
    setApiError('');
    setShowForm(true);
  }

  async function deleteProduct(id: string) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this product?'
    );

    if (!confirmed) return;

    setApiError('');

    try {
      await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
      setProducts((current) =>
        current.filter((product) => product._id !== id)
      );
    } catch {
      setApiError('Could not delete the product. Please try again.');
    }
  }

  const productDetails = products.map((product) => {
    const expiryDate = getExpiryDate(
      product.purchaseDate,
      product.warrantyMonths
    );

    return {
      ...product,
      expiryDate,
      status: getWarrantyStatus(expiryDate),
    };
  });

  const filteredProducts = productDetails.filter((product) =>
    `${product.name} ${product.category}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const activeCount = productDetails.filter(
    (product) => product.status === 'Active'
  ).length;

  const expiringCount = productDetails.filter(
    (product) => product.status === 'Expiring soon'
  ).length;

  const expiredCount = productDetails.filter(
    (product) => product.status === 'Expired'
  ).length;

  const statusStyles: Record<string, string> = {
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Expiring soon': 'bg-amber-50 text-amber-700 border-amber-200',
    Expired: 'bg-red-50 text-red-700 border-red-200',
  };

  // If user is not authenticated, show modern Authentication Screen
  if (!token || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200">
              <ShieldCheck size={36} />
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
              ProofKeep.
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Your personal device & warranty manager
            </p>
          </div>

          {/* Auth Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            {/* Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                  authMode === 'login'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError('');
                }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                  authMode === 'register'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Create Account
              </button>
            </div>

            {authError && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    FULL NAME
                  </label>
                  <div className="relative">
                    <UserIcon
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="e.g. Alex Johnson"
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  PASSWORD
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                {authMode === 'register' && (
                  <p className="mt-1 text-xs text-slate-400">
                    Must be at least 6 characters
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {authLoading
                  ? 'Please wait...'
                  : authMode === 'login'
                    ? 'Sign In'
                    : 'Create My Account'}
              </button>
            </form>

            {/* Quick Demo Fill button */}
            <div className="mt-6 border-t border-slate-100 pt-5 text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthEmail('demo@proofkeep.com');
                  setAuthPassword('password123');
                }}
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800 underline underline-offset-4"
              >
                Auto-fill demo credentials
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      {/* Sidebar */}
      <aside className="w-full border-b border-slate-200 bg-white p-6 md:min-h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-r flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <ShieldCheck size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-emerald-700">
                ProofKeep.
              </h1>
              <p className="text-xs text-slate-500">
                Your purchases, protected.
              </p>
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            <a
              href="#dashboard"
              className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3 font-medium text-emerald-700"
            >
              <LayoutDashboard size={20} />
              Dashboard
            </a>
            <a
              href="#products"
              className="flex items-center gap-3 rounded-xl p-3 text-slate-600 hover:bg-slate-100"
            >
              <Package size={20} />
              My devices
            </a>
            <a
              href="#expiring"
              className="flex items-center gap-3 rounded-xl p-3 text-slate-600 hover:bg-slate-100"
            >
              <Clock size={20} />
              Warranty status
            </a>
            <a
              href="#settings"
              className="flex items-center gap-3 rounded-xl p-3 text-slate-600 hover:bg-slate-100"
            >
              <Settings size={20} />
              About
            </a>
          </nav>
        </div>

        {/* User Profile & Logout section in Sidebar */}
        <div className="mt-8 border-t border-slate-200 pt-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-sm">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {currentUser.name}
              </p>
              <p className="truncate text-xs text-slate-400">
                {currentUser.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-700 hover:border-red-200"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main id="dashboard" className="min-w-0 flex-1 p-5 md:p-10">
        <header className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="text-sm font-medium tracking-wide text-emerald-700">
              HELLO, {currentUser.name.toUpperCase()} 👋
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Device Inventory
            </h2>
            <p className="mt-2 text-slate-500">
              Keep every device photo, purchase date, and warranty in one place.
            </p>
          </div>

          <button
            onClick={() => {
              setError('');
              setName('');
              setCategory('Electronics');
              setPurchaseDate('');
              setWarrantyMonths('12');
              handleClearImage();
              setEditingId(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-medium text-white transition hover:bg-emerald-800 shadow-sm"
          >
            <Plus size={20} />
            Add device
          </button>
        </header>

        {apiError && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {apiError}
          </div>
        )}

        {/* Stats Grid */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">Total devices</p>
            <p className="mt-3 text-3xl font-bold">
              {products.length.toString().padStart(2, '0')}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">Active warranties</p>
            <p className="mt-3 text-3xl font-bold text-emerald-700">
              {activeCount.toString().padStart(2, '0')}
            </p>
          </div>

          <div
            id="expiring"
            className="rounded-2xl border border-slate-200 bg-white p-6"
          >
            <p className="text-sm text-slate-500">Expiring soon</p>
            <p className="mt-3 text-3xl font-bold text-amber-600">
              {expiringCount.toString().padStart(2, '0')}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">Expired warranties</p>
            <p className="mt-3 text-3xl font-bold text-red-600">
              {expiredCount.toString().padStart(2, '0')}
            </p>
          </div>
        </section>

        {/* Add / Edit Form Modal */}
        {showForm && (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold">
                  {editingId ? 'Edit device' : 'Add a device'}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Enter device details and add an optional photo.
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={saveProduct}
              className="grid gap-5 sm:grid-cols-2"
            >
              <label className="text-sm font-medium text-slate-700">
                Device name
                <input
                  required
                  maxLength={100}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. MacBook Pro M3 or iPhone 17"
                  className="mt-2 block w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Category
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-white p-3 outline-none focus:border-emerald-600"
                >
                  <option>Electronics</option>
                  <option>Accessories</option>
                  <option>Home appliances</option>
                  <option>Other</option>
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Purchase date
                <input
                  required
                  type="date"
                  max={new Date().toLocaleDateString('en-CA')}
                  value={purchaseDate}
                  onChange={(event) => setPurchaseDate(event.target.value)}
                  className="mt-2 block w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-emerald-600"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Warranty duration
                <select
                  value={warrantyMonths}
                  onChange={(event) => setWarrantyMonths(event.target.value)}
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-white p-3 outline-none focus:border-emerald-600"
                >
                  <option value="3">3 months</option>
                  <option value="6">6 months</option>
                  <option value="12">1 year</option>
                  <option value="24">2 years</option>
                  <option value="36">3 years</option>
                  <option value="60">5 years</option>
                </select>
              </label>

              {/* DEVICE IMAGE UPLOAD SECTION */}
              <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={18} className="text-emerald-700" />
                    <span className="text-sm font-semibold text-slate-800">
                      Device Image
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setImageInputMode('upload')}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                        imageInputMode === 'upload'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      File Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode('url')}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                        imageInputMode === 'url'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      Image URL
                    </button>
                  </div>
                </div>

                {imageInputMode === 'upload' ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="device-image-input"
                    />

                    {!imagePreview ? (
                      <label
                        htmlFor="device-image-input"
                        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/30 transition group"
                      >
                        <Upload
                          size={28}
                          className="text-slate-400 group-hover:text-emerald-600 transition"
                        />
                        <p className="mt-2 text-sm font-medium text-slate-700">
                          Click to upload device photo
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          PNG, JPG, WEBP up to 10MB
                        </p>
                      </label>
                    ) : (
                      <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200">
                        <img
                          src={imagePreview}
                          alt="Device preview"
                          className="h-20 w-20 rounded-lg object-cover border border-slate-200"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {imageFile ? imageFile.name : 'Selected image'}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Ready to save with device
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearImage}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Remove image"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      placeholder="https://example.com/device-photo.jpg"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setImagePreview(e.target.value);
                        setImageFile(null);
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-emerald-600"
                    />
                    {imageUrl && (
                      <div className="mt-3 flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200">
                        <img
                          src={imageUrl}
                          alt="Device preview"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                          className="h-20 w-20 rounded-lg object-cover border border-slate-200"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-500 truncate">
                            {imageUrl}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearImage}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Remove image"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-600 sm:col-span-2">
                  {error}
                </p>
              )}

              <div className="flex flex-wrap gap-3 sm:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-700 px-5 py-3 font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 transition shadow-sm"
                >
                  {saving ? 'Saving...' : editingId ? 'Update device' : 'Save device'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-slate-200 px-5 py-3 font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Devices list */}
        <section id="products" className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold">Your devices</h3>
              <p className="mt-1 text-sm text-slate-500">
                Manage your devices, warranty periods, and photos.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <Search size={18} className="text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search devices..."
                aria-label="Search devices"
                className="w-40 bg-transparent text-sm outline-none sm:w-48"
              />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {loading && (
              <p className="py-6 text-center text-slate-500">
                Loading your devices...
              </p>
            )}

            {!loading &&
              filteredProducts.map((product) => (
                <article
                  key={product._id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-200 hover:shadow-xs"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    {/* Device Image or Fallback Category Icon */}
                    {product.image ? (
                      <div
                        onClick={() =>
                          setPreviewModalImage({
                            url: product.image!,
                            title: product.name,
                          })
                        }
                        className="relative group h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                        title="Click to view full image"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                          onError={(e) => {
                            // If image fails to load, replace with fallback
                            (e.target as HTMLElement).parentElement!.innerHTML = `
                              <div class="flex h-16 w-16 items-center justify-center text-2xl">
                                ${product.icon}
                              </div>
                            `;
                          }}
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <Eye size={16} className="text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl border border-slate-200">
                        {product.icon}
                      </div>
                    )}

                    <div className="min-w-0">
                      <h4 className="break-words font-semibold text-slate-900">
                        {product.name}
                      </h4>
                      <p className="mt-1 text-sm text-slate-500">
                        {product.category}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Purchased:{' '}
                        {formatDate(new Date(`${product.purchaseDate}T12:00:00`))}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Warranty expires:{' '}
                        {formatDate(
                          getExpiryDate(
                            product.purchaseDate,
                            product.warrantyMonths
                          )
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        statusStyles[
                          getWarrantyStatus(
                            getExpiryDate(
                              product.purchaseDate,
                              product.warrantyMonths
                            )
                          )
                        ]
                      }`}
                    >
                      {getWarrantyStatus(
                        getExpiryDate(
                          product.purchaseDate,
                          product.warrantyMonths
                        )
                      )}
                    </span>

                    <button
                      onClick={() => editProduct(product)}
                      aria-label={`Edit ${product.name}`}
                      title="Edit device"
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      <Pencil size={18} />
                    </button>

                    <button
                      onClick={() => deleteProduct(product._id)}
                      aria-label={`Delete ${product.name}`}
                      title="Delete device"
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </article>
              ))}

            {!loading && filteredProducts.length === 0 && !apiError && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <Package className="mx-auto text-slate-400" size={36} />
                <h4 className="mt-3 font-semibold">No devices found</h4>
                <p className="mt-1 text-sm text-slate-500">
                  Try another search or add a new device with its photo.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Full Image Preview Modal */}
        {previewModalImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
            onClick={() => setPreviewModalImage(null)}
          >
            <div
              className="relative max-h-[90vh] max-w-2xl overflow-hidden rounded-2xl bg-white p-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h4 className="font-semibold text-slate-800">
                  {previewModalImage.title}
                </h4>
                <button
                  onClick={() => setPreviewModalImage(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="mt-3 flex justify-center bg-slate-50 rounded-xl overflow-hidden">
                <img
                  src={previewModalImage.url}
                  alt={previewModalImage.title}
                  className="max-h-[70vh] w-auto object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        <footer
          id="settings"
          className="mt-10 border-t border-slate-200 py-6 text-center text-sm text-slate-400"
        >
          ProofKeep · Your devices and warranties, organized.
        </footer>
      </main>
    </div>
  );
}

export default App;
