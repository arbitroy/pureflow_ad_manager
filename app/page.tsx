'use client';
import Navbar from '@/components/Navbar';
import PageContainer from '@/components/PageContainer';
import { motion } from 'framer-motion';

export default function Home() {
  // Dashboard stats cards (placeholders)
  const stats = [
    { title: 'Active Campaigns', value: '12', change: '+2', changeType: 'increase' },
    { title: 'Total Impressions', value: '45.2K', change: '+12%', changeType: 'increase' },
    { title: 'Conversion Rate', value: '2.4%', change: '-0.2%', changeType: 'decrease' },
    { title: 'Total ROI', value: '215%', change: '+15%', changeType: 'increase' },
  ];

  return (
    <>
      <Navbar />
      <PageContainer title="Dashboard">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              className="card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <h3 className="text-gray-400 font-medium">{stat.title}</h3>
              <div className="flex items-end mt-2">
                <span className="text-2xl font-bold text-white">{stat.value}</span>
                <span 
                  className={`ml-2 text-sm ${
                    stat.changeType === 'increase' ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {stat.change}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card h-80">
            <h3 className="text-lg font-medium mb-4">Campaign Performance</h3>
            <div className="h-64 flex items-center justify-center text-gray-500">
              Chart.js implementation here
            </div>
          </div>
          <div className="card h-80">
            <h3 className="text-lg font-medium mb-4">Active Campaigns</h3>
            <div className="space-y-4">
              {[1, 2, 3].map((_, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-pure-dark rounded-lg">
                  <div>
                    <h4 className="font-medium">Summer Promotion {index + 1}</h4>
                    <p className="text-sm text-gray-400">Facebook, Instagram</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm ${index % 2 === 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {index % 2 === 0 ? 'Active' : 'Pending'}
                    </p>
                    <p className="text-sm text-gray-400">Budget: $500</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  );
}