import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';

const RegisterForm = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    const result = await registerUser({
      email: data.email,
      password: data.password,
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    if (result.success) {
      toast.success('登録に成功しました！メールを確認してください。');
      navigate('/dashboard');
    } else {
      toast.error(result.message || '登録に失敗しました');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 px-4 py-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              アカウント作成
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              AIカウンセリングを始めましょう
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    名前
                  </label>
                  <input
                    {...register('firstName', {
                      required: '名前を入力してください',
                      maxLength: {
                        value: 50,
                        message: '名前は50文字以下にしてください'
                      }
                    })}
                    type="text"
                    autoComplete="given-name"
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.firstName ? 'border-red-300' : 'border-gray-300'
                    } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                    placeholder="太郎"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    姓
                  </label>
                  <input
                    {...register('lastName', {
                      required: '姓を入力してください',
                      maxLength: {
                        value: 50,
                        message: '姓は50文字以下にしてください'
                      }
                    })}
                    type="text"
                    autoComplete="family-name"
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.lastName ? 'border-red-300' : 'border-gray-300'
                    } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                    placeholder="山田"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  ユーザー名
                </label>
                <input
                  {...register('username', {
                    required: 'ユーザー名を入力してください',
                    minLength: {
                      value: 3,
                      message: 'ユーザー名は3文字以上にしてください'
                    },
                    maxLength: {
                      value: 30,
                      message: 'ユーザー名は30文字以下にしてください'
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9_-]+$/,
                      message: 'ユーザー名は英数字、ハイフン、アンダースコアのみ使用できます'
                    }
                  })}
                  type="text"
                  autoComplete="username"
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.username ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  placeholder="yamada_taro"
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  メールアドレス
                </label>
                <input
                  {...register('email', {
                    required: 'メールアドレスを入力してください',
                    pattern: {
                      value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                      message: '有効なメールアドレスを入力してください'
                    }
                  })}
                  type="email"
                  autoComplete="email"
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  placeholder="example@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  パスワード
                </label>
                <div className="mt-1 relative">
                  <input
                    {...register('password', {
                      required: 'パスワードを入力してください',
                      minLength: {
                        value: 8,
                        message: 'パスワードは8文字以上にしてください'
                      },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message: 'パスワードは小文字、大文字、数字を含む必要があります'
                      }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`block w-full px-3 py-2 pr-10 border ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  パスワード（確認）
                </label>
                <div className="mt-1 relative">
                  <input
                    {...register('confirmPassword', {
                      required: 'パスワードを再入力してください',
                      validate: value =>
                        value === password || 'パスワードが一致しません'
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`block w-full px-3 py-2 pr-10 border ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <input
                {...register('agreeToTerms', {
                  required: '利用規約に同意してください'
                })}
                id="agree-terms"
                type="checkbox"
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-700">
                <Link to="/terms" className="text-purple-600 hover:text-purple-500">
                  利用規約
                </Link>
                と
                <Link to="/privacy" className="text-purple-600 hover:text-purple-500">
                  プライバシーポリシー
                </Link>
                に同意します
              </label>
            </div>
            {errors.agreeToTerms && (
              <p className="text-sm text-red-600">{errors.agreeToTerms.message}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
            >
              {isLoading ? '登録中...' : 'アカウント作成'}
            </button>

            <div className="mt-6 text-center">
              <span className="text-sm text-gray-600">
                既にアカウントをお持ちの方は{' '}
              </span>
              <Link
                to="/login"
                className="font-medium text-purple-600 hover:text-purple-500"
              >
                ログイン
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;