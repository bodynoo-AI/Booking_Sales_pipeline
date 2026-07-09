import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, message, Tabs } from 'antd';
import { AuthApi } from '../services';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      setLoading(true);
      const response = await AuthApi.login({ ...values, remember: true });
      if (response.success) {
        localStorage.setItem('auth_token', response.data.accessToken);
        localStorage.setItem('auth_user_name', response.data.user.name);
        localStorage.setItem('auth_user_email', response.data.user.email);
        message.success('Logged in successfully');
        navigate('/bkg');
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: { name: string; email: string; password: string }) => {
    try {
      setLoading(true);
      const response = await AuthApi.register(values);
      if (response.success) {
        localStorage.setItem('auth_token', response.data.accessToken);
        localStorage.setItem('auth_user_name', response.data.user.name);
        localStorage.setItem('auth_user_email', response.data.user.email);
        message.success('Account created successfully');
        navigate('/bkg');
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f7',
        padding: 20,
      }}
    >
      <Card
        style={{ width: 420, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}
        bodyStyle={{ padding: '40px 32px' }}
      >
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <h1 style={{ margin: 0, color: '#111827' }}>EventHub360 Login</h1>
          <p style={{ margin: '8px 0 0', color: '#6b7280' }}>Sign in to manage bookings and dashboard.</p>
        </div>

        <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key as 'login' | 'register')}>
          <Tabs.TabPane tab="Login" key="login">
            <Form layout="vertical" onFinish={handleLogin}>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ required: true, message: 'Please enter your email' }, { type: 'email', message: 'Enter a valid email' }]}
              >
                <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
              </Form.Item>

              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: 'Please enter your password' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                  Sign in
                </Button>
              </Form.Item>
            </Form>
          </Tabs.TabPane>

          <Tabs.TabPane tab="Register" key="register">
            <Form layout="vertical" onFinish={handleRegister}>
              <Form.Item
                name="name"
                label="Name"
                rules={[{ required: true, message: 'Please enter your name' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Full name" size="large" />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                rules={[{ required: true, message: 'Please enter your email' }, { type: 'email', message: 'Enter a valid email' }]}
              >
                <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
              </Form.Item>

              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: 'Please enter your password' }, { min: 6, message: 'Password must be at least 6 characters' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                  Create account
                </Button>
              </Form.Item>
            </Form>
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default LoginPage;
