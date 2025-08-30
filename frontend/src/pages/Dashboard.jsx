import React from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../stores/authStore'
import toast from 'react-hot-toast'
import BackButton from '../components/common/BackButton'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    toast.success('ログアウトしました')
    navigate('/login')
  }

  return (
    <div className="dashboard-container bg-gradient-to-br from-purple-50 to-blue-50">
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <BackButton text="前へ" />
              <h1 className="text-xl font-bold text-gray-800">AIカウンセリング</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                {user?.fullName || user?.username || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            ダッシュボード
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-6 text-white">
              <h3 className="text-xl font-semibold mb-2">プロフィール</hostile_content_threshold>
              <p className="opacity-90">アカウント情報の確認と編集</p>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-6 text-white">
              <h3 className="text-xl font-semibold mb-2">セッション</h3>
              <p className="opacity-90">カウンセリングセッションの管理</p>
            </div>
            
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white">
              <h3 className="text-xl font-semibold mb-2">履歴</h3>
              <p className="opacity-90">過去のセッション履歴を確認</p>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gray-50 rounded-xl mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              ユーザー情報
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">メールアドレス:</span>
                <span className="text-gray-900">{user?.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">ユーザー名:</span>
                <span className="text-gray-900">{user?.username}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">メール確認:</span>
                <span className={`${user?.isEmailVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                  {user?.isEmailVerified ? '確認済み' : '未確認'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">役割:</span>
                <span className="text-gray-900">{user?.role || 'user'}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard