'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from '@/components/layouts/ThemeProvider';
import { Search, Book, Lightbulb, HelpCircle, Mail, MessageSquare, ExternalLink } from 'lucide-react';

// Define help content
const faqContent = [
  {
    question: "How do I place a shopping request?",
    answer: "To place a shopping request, navigate to the 'Requests' tab and click on 'Create New Request'. Fill out the form with details about the item you want, including descriptions, images if available, and your budget."
  },
  {
    question: "What payment methods are accepted?",
    answer: "We accept major credit/debit cards (Visa, Mastercard, American Express), PayPal, and bank transfers. All payments are processed securely through our payment processor."
  },
  {
    question: "How are shipping costs calculated?",
    answer: "Shipping costs are calculated based on the weight of the item, destination country, and shipping method chosen. Once a shopper accepts your request, they will provide estimated shipping costs for your approval before proceeding."
  },
  {
    question: "What if my item arrives damaged?",
    answer: "If your item arrives damaged, please take photos and contact our support team within 48 hours of delivery. We'll work with you and the shopper to resolve the issue, which may include a refund or replacement."
  },
  {
    question: "How do I become a shopper?",
    answer: "To become a shopper, go to your profile settings and select 'Become a Shopper'. You'll need to complete a verification process, including identity verification and providing information about your shopping expertise and location in Japan."
  },
  {
    question: "What fees do shoppers pay?",
    answer: "Shoppers pay a 5% service fee on each transaction. This fee helps us maintain the platform, provide customer support, and process secure payments."
  },
  {
    question: "Can I cancel an order?",
    answer: "You can cancel an order before a shopper has purchased the item with no penalty. Once the item has been purchased, cancellations may be subject to a restocking fee or may not be possible if the item was custom-ordered."
  },
  {
    question: "How do I track my order?",
    answer: "Once your item has been shipped, the shopper will provide a tracking number which will be displayed in your order details. You can click on this tracking number to see the current status and location of your package."
  }
];

const guideContent = [
  {
    title: "Getting Started Guide",
    sections: [
      {
        heading: "Creating Your Account",
        content: "Sign up using your email address and create a strong password. Complete your profile with your name, shipping address, and preferences."
      },
      {
        heading: "Browsing Available Items",
        content: "Explore the 'Explore' section to see items that shoppers have available for immediate purchase. Use filters to narrow down by category, price, or location."
      },
      {
        heading: "Placing Your First Request",
        content: "Click 'New Request' to specify an item you'd like purchased from Japan. Include as much detail as possible, such as product name, store, price, and any specific requirements."
      }
    ]
  },
  {
    title: "For Buyers",
    sections: [
      {
        heading: "Setting a Realistic Budget",
        content: "When creating a request, remember to include enough budget for the item price, domestic shipping in Japan, the shopper's service fee, and international shipping to your location."
      },
      {
        heading: "Communicating with Shoppers",
        content: "Use the messaging system to discuss details with your shopper. Clear communication helps ensure you get exactly what you're looking for."
      },
      {
        heading: "Leaving Feedback",
        content: "After receiving your item, leave honest feedback for your shopper. This helps maintain quality service for all users."
      }
    ]
  },
  {
    title: "For Shoppers",
    sections: [
      {
        heading: "Finding Requests to Fulfill",
        content: "Browse the 'Available Requests' section to find shopping requests that match your location and expertise. Filter by category, budget, or keywords."
      },
      {
        heading: "Providing Accurate Quotes",
        content: "When accepting a request, provide detailed information about costs, including the item price, domestic shipping, your service fee, and estimated international shipping."
      },
      {
        heading: "Shipping and Handling",
        content: "Package items securely and obtain tracking information. Update the buyer with photos of the item and packaging before shipping."
      }
    ]
  }
];

const HelpPage = ({ isWindowView = true }) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGuide, setActiveGuide] = useState(0);
  
  // Filter FAQs based on search query
  const filteredFAQs = searchQuery.trim() === '' 
    ? faqContent 
    : faqContent.filter(item => 
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div 
      className={`${isWindowView ? 'p-4' : 'p-6 bg-white rounded-lg shadow'}`}
      style={isWindowView ? { backgroundColor: `#${theme.bgColor}` } : {}}
    >
      <h1 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: `#${theme.textColor}` }}>
        <HelpCircle className="w-5 h-5" />
        <span>Help Center</span>
      </h1>
      
      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <Input
          type="search"
          placeholder="Search for help topics..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            backgroundColor: `#${theme.bgColor}`,
            color: `#${theme.textColor}`,
            borderColor: `#${theme.borderColor}`
          }}
        />
      </div>
      
      <Tabs defaultValue="faq" className="w-full">
        <TabsList 
          className="grid grid-cols-3 mb-4"
          style={{
            backgroundColor: `#${theme.buttonBgColor}`,
            borderColor: `#${theme.borderColor}`
          }}
        >
          <TabsTrigger 
            value="faq"
            className="flex items-center gap-1"
            style={{
              color: `#${theme.textColor}`,
              borderColor: `#${theme.borderColor}`
            }}
          >
            <Lightbulb className="w-4 h-4" />
            <span>FAQs</span>
          </TabsTrigger>
          <TabsTrigger 
            value="guides"
            className="flex items-center gap-1"
            style={{
              color: `#${theme.textColor}`,
              borderColor: `#${theme.borderColor}`
            }}
          >
            <Book className="w-4 h-4" />
            <span>User Guides</span>
          </TabsTrigger>
          <TabsTrigger 
            value="contact"
            className="flex items-center gap-1"
            style={{
              color: `#${theme.textColor}`,
              borderColor: `#${theme.borderColor}`
            }}
          >
            <Mail className="w-4 h-4" />
            <span>Contact Support</span>
          </TabsTrigger>
        </TabsList>
        
        {/* FAQs Tab */}
        <TabsContent value="faq" className="space-y-4">
          {filteredFAQs.length === 0 ? (
            <div 
              className="p-6 text-center border rounded"
              style={{ 
                borderColor: `#${theme.borderColor}`,
                color: `#${theme.textColor}`
              }}
            >
              <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No results found for "{searchQuery}"</p>
              <p className="text-sm mt-2">Try a different search term or browse our guides.</p>
            </div>
          ) : (
            filteredFAQs.map((faq, index) => (
              <details 
                key={index} 
                className="group border rounded-sm overflow-hidden"
                style={{ borderColor: `#${theme.borderColor}` }}
                open={searchQuery !== ''}
              >
                <summary 
                  className="flex justify-between items-center cursor-pointer p-4"
                  style={{ 
                    backgroundColor: `#${theme.buttonBgColor}50`,
                    color: `#${theme.textColor}`
                  }}
                >
                  <span className="font-medium">{faq.question}</span>
                  <span className="transition group-open:rotate-180">▼</span>
                </summary>
                <div 
                  className="p-4 border-t"
                  style={{ 
                    borderColor: `#${theme.borderColor}`,
                    color: `#${theme.textColor}`
                  }}
                >
                  {faq.answer}
                </div>
              </details>
            ))
          )}
        </TabsContent>
        
        {/* Guides Tab */}
        <TabsContent value="guides" className="border rounded-sm" style={{ borderColor: `#${theme.borderColor}` }}>
          <div className="flex h-[500px]">
            {/* Guide Navigation */}
            <div 
              className="w-64 border-r overflow-y-auto p-4 space-y-2"
              style={{ borderColor: `#${theme.borderColor}` }}
            >
              {guideContent.map((guide, index) => (
                <div key={index}>
                  <h3 
                    className="font-medium mb-2"
                    style={{ color: `#${theme.textColor}` }}
                  >
                    {guide.title}
                  </h3>
                  <ul className="space-y-1 pl-2 text-sm">
                    {guide.sections.map((section, sectionIndex) => (
                      <li key={sectionIndex}>
                        <button
                          className={`text-left p-1 w-full rounded hover:underline ${activeGuide === index && 'font-medium'}`}
                          onClick={() => setActiveGuide(index)}
                          style={{ color: `#${theme.textColor}` }}
                        >
                          {section.heading}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            
            {/* Guide Content */}
            <div className="flex-1 p-4 overflow-y-auto">
              <h2 
                className="text-lg font-bold mb-4"
                style={{ color: `#${theme.textColor}` }}
              >
                {guideContent[activeGuide].title}
              </h2>
              
              <div className="space-y-4">
                {guideContent[activeGuide].sections.map((section, index) => (
                  <div key={index} className="mb-4">
                    <h3 
                      className="font-medium mb-2"
                      style={{ color: `#${theme.textColor}` }}
                    >
                      {section.heading}
                    </h3>
                    <p 
                      className="text-sm"
                      style={{ color: `#${theme.textColor}` }}
                    >
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* Contact Support Tab */}
        <TabsContent value="contact" className="space-y-4">
          <div 
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            style={{ color: `#${theme.textColor}` }}
          >
            <div className="border rounded p-4" style={{ borderColor: `#${theme.borderColor}` }}>
              <h3 className="font-medium flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5" />
                Live Chat Support
              </h3>
              <p className="text-sm mb-3">Talk to our support team in real-time for immediate assistance.</p>
              <p className="text-sm mb-3">Available Monday-Friday, 9AM-6PM JST</p>
              <Button
                className="w-full mt-2"
                style={{
                  backgroundColor: `#${theme.buttonBgColor}`,
                  color: `#${theme.textColor}`,
                  borderColor: `#${theme.borderColor}`
                }}
              >
                Start Chat
              </Button>
            </div>
            
            <div className="border rounded p-4" style={{ borderColor: `#${theme.borderColor}` }}>
              <h3 className="font-medium flex items-center gap-2 mb-3">
                <Mail className="w-5 h-5" />
                Email Support
              </h3>
              <p className="text-sm mb-3">Send us an email and we'll respond within 24 hours.</p>
              <p className="text-sm font-medium mb-1">Email Address:</p>
              <p className="text-sm mb-3">support@japanshopper.com</p>
              <Button
                className="w-full mt-2"
                style={{
                  backgroundColor: `#${theme.buttonBgColor}`,
                  color: `#${theme.textColor}`,
                  borderColor: `#${theme.borderColor}`
                }}
              >
                Compose Email
              </Button>
            </div>
          </div>
          
          <div className="border rounded p-4 mt-4" style={{ borderColor: `#${theme.borderColor}` }}>
            <h3 className="font-medium mb-3">Contact Form</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Your Name</label>
                <Input 
                  placeholder="Enter your name"
                  style={{
                    backgroundColor: `#${theme.bgColor}`,
                    color: `#${theme.textColor}`,
                    borderColor: `#${theme.borderColor}`
                  }}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Email Address</label>
                <Input 
                  type="email"
                  placeholder="Enter your email address"
                  style={{
                    backgroundColor: `#${theme.bgColor}`,
                    color: `#${theme.textColor}`,
                    borderColor: `#${theme.borderColor}`
                  }}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Subject</label>
                <Input 
                  placeholder="Enter message subject"
                  style={{
                    backgroundColor: `#${theme.bgColor}`,
                    color: `#${theme.textColor}`,
                    borderColor: `#${theme.borderColor}`
                  }}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Message</label>
                <textarea 
                  className="w-full rounded border p-2"
                  rows={5}
                  placeholder="Describe your issue or question"
                  style={{
                    backgroundColor: `#${theme.bgColor}`,
                    color: `#${theme.textColor}`,
                    borderColor: `#${theme.borderColor}`
                  }}
                ></textarea>
              </div>
              <Button
                className="w-full"
                style={{
                  backgroundColor: `#${theme.buttonBgColor}`,
                  color: `#${theme.textColor}`,
                  borderColor: `#${theme.borderColor}`
                }}
              >
                Submit
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Additional Resources */}
      <div className="mt-6 pt-4 border-t" style={{ borderColor: `#${theme.borderColor}` }}>
        <h3 
          className="font-medium mb-3"
          style={{ color: `#${theme.textColor}` }}
        >
          Additional Resources
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="justify-start"
            style={{
              backgroundColor: `#${theme.buttonBgColor}`,
              color: `#${theme.textColor}`,
              borderColor: `#${theme.borderColor}`
            }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Video Tutorials
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            style={{
              backgroundColor: `#${theme.buttonBgColor}`,
              color: `#${theme.textColor}`,
              borderColor: `#${theme.borderColor}`
            }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Community Forum
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            style={{
              backgroundColor: `#${theme.buttonBgColor}`,
              color: `#${theme.textColor}`,
              borderColor: `#${theme.borderColor}`
            }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Developer API
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;