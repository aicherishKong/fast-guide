import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Check, Zap, Crown, Sparkles, CreditCard, History } from 'lucide-react';
import { toast } from 'sonner';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans = [
    {
      id: 'free',
      name: '免费版',
      icon: '🆓',
      price: { monthly: 0, yearly: 0 },
      description: '适合初次体验的用户',
      features: [
        { text: '5 次简历优化', included: true },
        { text: '3 次模拟面试', included: true },
        { text: '基础知识训练', included: true },
        { text: '基础 AI 建议', included: true },
        { text: '社区支持', included: true },
        { text: '高级优化算法', included: false },
        { text: '无限面试次数', included: false },
        { text: '优先客服', included: false },
      ],
      popular: false,
    },
    {
      id: 'pro',
      name: '专业版',
      icon: '⚡',
      price: { monthly: 99, yearly: 990 },
      description: '适合认真求职的用户',
      features: [
        { text: '无限简历优化', included: true },
        { text: '30 次/月模拟面试', included: true },
        { text: '完整知识训练', included: true },
        { text: '高级 AI 分析', included: true },
        { text: '面试报告下载', included: true },
        { text: '高级优化算法', included: true },
        { text: '邮件支持', included: true },
        { text: '优先客服', included: false },
      ],
      popular: true,
    },
    {
      id: 'premium',
      name: '旗舰版',
      icon: '👑',
      price: { monthly: 299, yearly: 2990 },
      description: '适合追求极致的用户',
      features: [
        { text: '无限简历优化', included: true },
        { text: '无限模拟面试', included: true },
        { text: '专属知识库', included: true },
        { text: '顶级 AI 助手', included: true },
        { text: '1对1 职业咨询', included: true },
        { text: '面试真题库', included: true },
        { text: '优先客服', included: true },
        { text: 'API 接入', included: true },
      ],
      popular: false,
    },
  ];

  const purchaseHistory = [
    {
      date: '2024-03-01',
      plan: '专业版',
      amount: 99,
      status: '已完成',
      duration: '1个月',
    },
    {
      date: '2024-02-01',
      plan: '专业版',
      amount: 99,
      status: '已完成',
      duration: '1个月',
    },
  ];

  const handleSubscribe = (planId: string) => {
    if (planId === 'free') {
      toast.success('您已在使用免费版！');
      return;
    }
    setSelectedPlan(planId);
    setShowPaymentDialog(true);
  };

  const handlePayment = () => {
    // Mock 支付逻辑
    toast.success('订阅成功！感谢您的支持 🎉');
    setShowPaymentDialog(false);
    setSelectedPlan(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* 页面标题 */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">选择适合您的套餐</h1>
        <p className="text-muted-foreground text-lg">
          解锁更多功能，加速您的求职之路
        </p>
      </div>

      {/* 计费周期切换 */}
      <div className="flex justify-center">
        <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-md transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white shadow-sm font-medium'
                : 'text-muted-foreground'
            }`}
          >
            按月付费
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-md transition-all ${
              billingCycle === 'yearly'
                ? 'bg-white shadow-sm font-medium'
                : 'text-muted-foreground'
            }`}
          >
            按年付费
            <Badge className="ml-2 bg-green-500">省17%</Badge>
          </button>
        </div>
      </div>

      {/* 套餐卡片 */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative ${
              plan.popular ? 'border-blue-500 border-2 shadow-lg' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-blue-500 px-4 py-1">
                  <Sparkles className="h-3 w-3 mr-1 inline" />
                  最受欢迎
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-8">
              <div className="text-5xl mb-4">{plan.icon}</div>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription className="mt-2">{plan.description}</CardDescription>
              
              <div className="mt-6">
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-bold">
                    ¥{plan.price[billingCycle]}
                  </span>
                  {plan.price[billingCycle] > 0 && (
                    <span className="text-muted-foreground ml-2">
                      /{billingCycle === 'monthly' ? '月' : '年'}
                    </span>
                  )}
                </div>
                {billingCycle === 'yearly' && plan.price.yearly > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    相当于 ¥{Math.round(plan.price.yearly / 12)}/月
                  </p>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* 功能列表 */}
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check
                      className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                        feature.included
                          ? 'text-green-500'
                          : 'text-gray-300'
                      }`}
                    />
                    <span
                      className={
                        feature.included
                          ? 'text-foreground'
                          : 'text-muted-foreground line-through'
                      }
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* 订阅按钮 */}
              <Button
                onClick={() => handleSubscribe(plan.id)}
                className="w-full"
                variant={plan.popular ? 'default' : 'outline'}
                size="lg"
              >
                {plan.id === 'free' ? '当前套餐' : '立即订阅'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 充值记录 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            充值记录
          </CardTitle>
          <CardDescription>查看您的订阅和充值历史</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">日期</th>
                  <th className="text-left py-3 px-4">套餐</th>
                  <th className="text-left py-3 px-4">时长</th>
                  <th className="text-right py-3 px-4">金额</th>
                  <th className="text-right py-3 px-4">状态</th>
                </tr>
              </thead>
              <tbody>
                {purchaseHistory.map((record, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-4 px-4 text-muted-foreground">{record.date}</td>
                    <td className="py-4 px-4 font-medium">{record.plan}</td>
                    <td className="py-4 px-4 text-muted-foreground">{record.duration}</td>
                    <td className="py-4 px-4 text-right font-medium">¥{record.amount}</td>
                    <td className="py-4 px-4 text-right">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {record.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 支付对话框 */}
      {showPaymentDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                选择支付方式
              </CardTitle>
              <CardDescription>
                订阅{' '}
                <span className="font-semibold">
                  {plans.find((p) => p.id === selectedPlan)?.name}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 支付金额 */}
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">支付金额</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  ¥
                  {plans.find((p) => p.id === selectedPlan)?.price[billingCycle]}
                </p>
              </div>

              {/* 支付方式 */}
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="text-2xl">💳</div>
                  <div className="text-left flex-1">
                    <p className="font-medium">支付宝</p>
                    <p className="text-sm text-muted-foreground">推荐使用</p>
                  </div>
                  <div className="text-blue-600">→</div>
                </button>

                <button className="w-full flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="text-2xl">💚</div>
                  <div className="text-left flex-1">
                    <p className="font-medium">微信支付</p>
                    <p className="text-sm text-muted-foreground">扫码支付</p>
                  </div>
                  <div className="text-green-600">→</div>
                </button>

                <button className="w-full flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="text-2xl">💰</div>
                  <div className="text-left flex-1">
                    <p className="font-medium">余额支付</p>
                    <p className="text-sm text-muted-foreground">当前余额：¥0</p>
                  </div>
                  <div className="text-gray-400">→</div>
                </button>
              </div>

              {/* 按钮 */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowPaymentDialog(false);
                    setSelectedPlan(null);
                  }}
                >
                  取消
                </Button>
                <Button className="flex-1" onClick={handlePayment}>
                  确认支付
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 常见问题 */}
      <Card>
        <CardHeader>
          <CardTitle>常见问题</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">如何取消订阅？</h3>
            <p className="text-sm text-muted-foreground">
              您可以随时在设置页面取消订阅，取消后在当前计费周期结束前仍可使用付费功能。
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">支持哪些支付方式？</h3>
            <p className="text-sm text-muted-foreground">
              我们支持支付宝、微信支付、银行卡等多种支付方式，安全便捷。
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">可以开具发票吗？</h3>
            <p className="text-sm text-muted-foreground">
              可以，在支付成功后，您可以在充值记录中申请开具电子发票。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
