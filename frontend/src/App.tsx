import  { useState } from 'react';
import { User, Mail, Lock, LogOut, Sparkles, Zap, Shield, TrendingUp, Users, Target, Award } from 'lucide-react';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <nav className="bg-black bg-opacity-40 backdrop-blur-xl border-b border-purple-500 border-opacity-30">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Dashboard
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-lg transition-all duration-300 font-semibold shadow-lg hover:shadow-red-500/50"
            >
              <LogOut className="w-5 h-5" />
              Выйти
            </button>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-6 py-16">
          <div className="mb-16 text-center">
            <h1 className="text-6xl font-black text-white mb-4 animate-pulse">
              Добро пожаловать! 🚀
            </h1>
            <p className="text-2xl text-purple-300 font-light">
              Панель управления загружена и готова к работе
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-6 shadow-2xl hover:scale-105 transition-transform duration-300 cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-10 h-10 text-white" />
                <span className="text-3xl font-bold text-white">+23%</span>
              </div>
              <h3 className="text-white text-lg font-semibold">Рост</h3>
              <p className="text-purple-200 text-sm">За последний месяц</p>
            </div>

            <div className="bg-gradient-to-br from-pink-500 to-rose-700 rounded-2xl p-6 shadow-2xl hover:scale-105 transition-transform duration-300 cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-10 h-10 text-white" />
                <span className="text-3xl font-bold text-white">1.2K</span>
              </div>
              <h3 className="text-white text-lg font-semibold">Пользователи</h3>
              <p className="text-pink-200 text-sm">Активные сейчас</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-cyan-700 rounded-2xl p-6 shadow-2xl hover:scale-105 transition-transform duration-300 cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <Target className="w-10 h-10 text-white" />
                <span className="text-3xl font-bold text-white">87%</span>
              </div>
              <h3 className="text-white text-lg font-semibold">Цели</h3>
              <p className="text-blue-200 text-sm">Выполнено задач</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl p-6 shadow-2xl hover:scale-105 transition-transform duration-300 cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <Award className="w-10 h-10 text-white" />
                <span className="text-3xl font-bold text-white">42</span>
              </div>
              <h3 className="text-white text-lg font-semibold">Награды</h3>
              <p className="text-emerald-200 text-sm">Получено наград</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-black bg-opacity-40 backdrop-blur-xl rounded-2xl p-8 border border-purple-500 border-opacity-30 shadow-2xl">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/50">
                <Zap className="w-9 h-9 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Быстрый старт</h3>
              <p className="text-purple-300 leading-relaxed">
                Начните работу с нашей платформой за считанные минуты. Интуитивный интерфейс и мощные инструменты.
              </p>
            </div>

            <div className="bg-black bg-opacity-40 backdrop-blur-xl rounded-2xl p-8 border border-purple-500 border-opacity-30 shadow-2xl">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/50">
                <Shield className="w-9 h-9 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Максимальная защита</h3>
              <p className="text-purple-300 leading-relaxed">
                Ваши данные защищены 24/7 современными системами безопасности и шифрованием.
              </p>
            </div>

            <div className="bg-black bg-opacity-40 backdrop-blur-xl rounded-2xl p-8 border border-purple-500 border-opacity-30 shadow-2xl">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-pink-500/50">
                <Sparkles className="w-9 h-9 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Инновации</h3>
              <p className="text-purple-300 leading-relaxed">
                Используйте самые современные технологии и будьте на шаг впереди конкурентов.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-1"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-2"></div>
      </div>

      <div className="relative bg-white bg-opacity-10 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 w-full max-w-md border-2 border-white border-opacity-20">
        <div className="text-center mb-10">
          <div className="inline-block p-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl mb-6 shadow-2xl shadow-purple-500/50">
            <User className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white mb-3">
            {showRegister ? 'Регистрация' : 'Добро пожаловать'}
          </h1>
          <p className="text-lg text-purple-100">
            {showRegister ? 'Создайте новый аккаунт' : 'Войдите в свой аккаунт'}
          </p>
        </div>

        <div className="space-y-6">
          {showRegister && (
            <div className="relative group">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-200 w-5 h-5 group-focus-within:text-white transition-colors" />
              <input
                type="text"
                placeholder="Введите ваше имя"
                className="w-full pl-12 pr-4 py-4 bg-white bg-opacity-20 border-2 border-white border-opacity-30 rounded-xl text-white placeholder-purple-200 focus:outline-none focus:border-purple-300 focus:bg-opacity-30 transition-all text-lg"
              />
            </div>
          )}

          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-200 w-5 h-5 group-focus-within:text-white transition-colors" />
            <input
              type="email"
              placeholder="Введите email"
              className="w-full pl-12 pr-4 py-4 bg-white bg-opacity-20 border-2 border-white border-opacity-30 rounded-xl text-white placeholder-purple-200 focus:outline-none focus:border-purple-300 focus:bg-opacity-30 transition-all text-lg"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-200 w-5 h-5 group-focus-within:text-white transition-colors" />
            <input
              type="password"
              placeholder="Введите пароль"
              className="w-full pl-12 pr-4 py-4 bg-white bg-opacity-20 border-2 border-white border-opacity-30 rounded-xl text-white placeholder-purple-200 focus:outline-none focus:border-purple-300 focus:bg-opacity-30 transition-all text-lg"
            />
          </div>

          <button
            onClick={handleLogin}
            className="w-full py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 text-white font-bold text-lg rounded-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105"
          >
            {showRegister ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => setShowRegister(!showRegister)}
            className="text-white hover:text-purple-200 transition-colors font-semibold text-lg"
          >
            {showRegister ? '← Уже есть аккаунт? Войти' : 'Нет аккаунта? Создать →'}
          </button>
        </div>
      </div>
    </div>
  );
}