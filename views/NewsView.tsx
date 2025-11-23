import React, { useEffect, useState } from 'react';
import { NewsItem } from '../types';
import { MockBackend } from '../services/mockBackend';
import { Card } from '../components/ui/Card';
import { CalendarDays } from 'lucide-react';

export const NewsView: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    MockBackend.getNews().then(setNews);
  }, []);

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-[#0D2137]">School Happenings</h2>
        <p className="text-gray-500 mt-2">Stay updated with the latest announcements, events, and achievements from Himalayan English School.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {news.map((item) => (
          <Card key={item.id} noPadding className="flex flex-col h-full">
            <div className="relative h-48 overflow-hidden group">
              <img 
                src={item.imageURL} 
                alt={item.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute top-4 left-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  item.type === 'event' ? 'bg-[#3EC7FF] text-white' : 'bg-orange-500 text-white'
                }`}>
                  {item.type}
                </span>
              </div>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-3">
                <CalendarDays size={14} />
                {new Date(item.postedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <h3 className="text-xl font-bold text-[#0D2137] mb-3 leading-tight">{item.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6 flex-grow">
                {item.body}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                <span className="text-xs font-medium text-gray-500">Posted by {item.postedBy}</span>
                <button className="text-[#3EC7FF] text-sm font-semibold hover:underline">Read More</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};