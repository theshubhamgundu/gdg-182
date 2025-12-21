
import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, MapPin, Users, ChevronRight, FileSearch, Bell, Share2, Printer, TrendingUp, Building2, Home, CheckCircle2, Clock, Wheat, School, Droplets, Lightbulb, BarChart3, Megaphone, AlertCircle, Hourglass } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { API_BASE_URL, apiFetch } from '../utils/supabase-client';
import { useLanguage } from '../utils/language-context';

interface Meeting {
    id: string;
    title: string;
    type: 'Gram Sabha' | 'Ward Meeting' | 'Municipal Council' | 'Panchayat';
    date: string;
    location: string;
    status: 'Completed' | 'Upcoming';
    summary: string;
    decisions: string[];
    attendees: number;
    budget?: string;
}

interface GramSabhaSummarizerProps {
    accessToken: string;
    onBack: () => void;
}

export function GramSabhaSummarizer({ accessToken, onBack }: GramSabhaSummarizerProps) {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
    const [filterType, setFilterType] = useState<string>('all');
    const { t } = useLanguage();

    useEffect(() => {
        fetchMeetings();
    }, []);

    const fetchMeetings = async () => {
        try {
            const response = await apiFetch(`${API_BASE_URL}/meetings`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setMeetings(data.meetings || []);
            }
        } catch (error) {
            console.error('Error fetching meetings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNotifyOthers = (meetingTitle: string) => {
        alert(`Notification sent to your local community about: ${meetingTitle}`);
    };

    const getMeetingIcon = (type: string) => {
        switch (type) {
            case 'Gram Sabha':
            case 'Panchayat':
                return <Home className="w-5 h-5 text-green-600" />;
            case 'Ward Meeting':
                return <Users className="w-5 h-5 text-blue-600" />;
            case 'Municipal Council':
                return <Building2 className="w-5 h-5 text-purple-600" />;
            default:
                return <Calendar className="w-5 h-5 text-gray-600" />;
        }
    };

    const getMeetingColor = (type: string) => {
        switch (type) {
            case 'Gram Sabha':
            case 'Panchayat':
                return 'border-l-green-500';
            case 'Ward Meeting':
                return 'border-l-blue-500';
            case 'Municipal Council':
                return 'border-l-purple-500';
            default:
                return 'border-l-gray-500';
        }
    };

    const filteredMeetings = filterType === 'all'
        ? meetings
        : meetings.filter(m => m.type === filterType);

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={onBack}>
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                {t('back')}
                            </Button>
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <Building2 className="w-6 h-6 text-green-600" />
                                    {t('gram-sabha')}
                                </h2>
                                <p className="text-sm text-gray-600">{t('village-meetings')}</p>
                            </div>
                        </div>
                        <Button variant="default" size="sm" className="gap-2 bg-green-600 hover:bg-green-700">
                            <Bell className="w-4 h-4" />
                            Subscribe to Alerts
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 py-6">
                {/* Filter Tabs */}
                <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
                    <Button
                        variant={filterType === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterType('all')}
                        className="whitespace-nowrap"
                    >
                        All Meetings
                    </Button>
                    <Button
                        variant={filterType === 'Gram Sabha' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterType('Gram Sabha')}
                        className="whitespace-nowrap"
                    >
                        <Wheat className="w-4 h-4 mr-1" />
                        Gram Sabha
                    </Button>
                    <Button
                        variant={filterType === 'Ward Meeting' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterType('Ward Meeting')}
                        className="whitespace-nowrap"
                    >
                        🏘️ Ward Meetings
                    </Button>
                    <Button
                        variant={filterType === 'Municipal Council' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterType('Municipal Council')}
                        className="whitespace-nowrap"
                    >
                        <Building2 className="w-4 h-4 mr-1" />
                        Municipal
                    </Button>
                </div>

                <Tabs defaultValue="meetings" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="meetings" className="gap-2">
                            <FileSearch className="w-4 h-4" />
                            All Meetings
                        </TabsTrigger>
                        <TabsTrigger value="insights" className="gap-2">
                            <Lightbulb className="w-4 h-4" />
                            AI Insights
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="meetings" className="space-y-4">
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-600"></div>
                            </div>
                        ) : filteredMeetings.length === 0 ? (
                            <Card>
                                <CardContent className="py-16 text-center">
                                    <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20 text-gray-400" />
                                    <p className="text-gray-500 text-lg font-medium">No meetings found</p>
                                    <p className="text-gray-400 text-sm mt-2">Check back later for updates from your local governance body</p>
                                </CardContent>
                            </Card>
                        ) : (
                            filteredMeetings.map((meeting) => (
                                <Card key={meeting.id} className={`hover:shadow-lg transition-all border-l-4 ${getMeetingColor(meeting.type)}`}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex gap-3 flex-1">
                                                <div className="mt-1">
                                                    {getMeetingIcon(meeting.type)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge variant="outline" className="text-xs">
                                                            {meeting.type}
                                                        </Badge>
                                                        <Badge variant={meeting.status === 'Completed' ? 'secondary' : 'default'}
                                                            className={meeting.status === 'Completed' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-blue-100 text-blue-800 border-blue-200'}>
                                                            {meeting.status}
                                                        </Badge>
                                                    </div>
                                                    <CardTitle className="text-lg leading-tight">{meeting.title}</CardTitle>
                                                    <CardDescription className="flex items-center gap-4 mt-2 text-xs">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(meeting.date).toLocaleDateString('en-IN', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            {meeting.location}
                                                        </span>
                                                        {meeting.attendees > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <Users className="w-3 h-3" />
                                                                {meeting.attendees} attended
                                                            </span>
                                                        )}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <p className="text-sm text-gray-700 leading-relaxed">
                                            {meeting.summary}
                                        </p>
                                        {meeting.decisions.length > 0 && (
                                            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                                                <p className="text-xs font-semibold text-green-800 mb-2 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Key Decisions ({meeting.decisions.length})
                                                </p>
                                                <ul className="space-y-1">
                                                    {meeting.decisions.slice(0, 2).map((decision, idx) => (
                                                        <li key={idx} className="text-xs text-gray-700 flex gap-2">
                                                            <span className="text-green-600">•</span>
                                                            <span>{decision}</span>
                                                        </li>
                                                    ))}
                                                    {meeting.decisions.length > 2 && (
                                                        <li className="text-xs text-green-600 italic">
                                                            +{meeting.decisions.length - 2} more decisions
                                                        </li>
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                        <div className="flex gap-2 pt-2">
                                            <Button size="sm" variant="default" onClick={() => setSelectedMeeting(meeting)} className="flex-1">
                                                <FileSearch className="w-4 h-4 mr-2" />
                                                View Full Details
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => handleNotifyOthers(meeting.title)}>
                                                <Share2 className="w-4 h-4 mr-2" />
                                                Share
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="insights" className="space-y-4">
                        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-green-600" />
                                    AI-Powered Insights
                                </CardTitle>
                                <CardDescription>Analysis based on recent meetings in your area</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <p className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" />
                                        Top Approved Projects
                                    </p>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex gap-2 items-start">
                                            <Lightbulb className="w-4 h-4 mt-0.5 text-yellow-600 flex-shrink-0" />
                                            <span>Streetlight installation in Ward 4 - ₹2.5L allocated</span>
                                        </li>
                                        <li className="flex gap-2 items-start">
                                            <span className="text-green-600 font-bold">2.</span>
                                            <span>💧 Clean Water Pipeline extension to East Basti - ₹8L</span>
                                        </li>
                                        <li className="flex gap-2 items-start">
                                            <School className="w-4 h-4 mt-0.5 text-purple-600 flex-shrink-0" />
                                            <span>Primary School renovation & painting - ₹5L</span>
                                        </li>
                                        <li className="flex gap-2 items-start">
                                            <Wheat className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                                            <span>Veterinary camp for livestock health - Free</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <p className="font-semibold text-blue-800 mb-3">⏳ Pending Actions:</p>
                                    <ul className="space-y-2 text-sm text-gray-700">
                                        <li className="flex gap-2 items-center">
                                            <Clock className="w-4 h-4 text-orange-500" />
                                            <span>Road repair contractor selection - Expected by 5th July</span>
                                        </li>
                                        <li className="flex gap-2 items-center">
                                            <Clock className="w-4 h-4 text-orange-500" />
                                            <span>Community hall booking system - Under review</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <p className="text-xs font-semibold text-blue-800 mb-2 flex items-center gap-1">
                                        <Lightbulb className="w-3 h-3" />
                                        JanAI Civic Tip
                                    </p>
                                    <p className="text-xs text-gray-700 leading-relaxed">
                                        You have the right to request detailed budget breakdowns and project timelines for any approved initiative.
                                        Visit your Block/Ward Office or file an RTI for transparency.
                                    </p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-3">
                                    <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                                        <p className="text-2xl font-bold text-green-600">4</p>
                                        <p className="text-xs text-gray-600">Meetings This Quarter</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                                        <p className="text-2xl font-bold text-blue-600">₹15.5L</p>
                                        <p className="text-xs text-gray-600">Total Budget Allocated</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>

            {/* Detail Modal */}
            {selectedMeeting && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
                            <div className="flex items-start justify-between">
                                <div className="flex gap-3 flex-1">
                                    {getMeetingIcon(selectedMeeting.type)}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="outline">{selectedMeeting.type}</Badge>
                                            <Badge className={selectedMeeting.status === 'Completed' ? 'bg-green-500' : 'bg-blue-500'}>
                                                {selectedMeeting.status}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-xl">{selectedMeeting.title}</CardTitle>
                                        <CardDescription className="flex gap-4 mt-2">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(selectedMeeting.date).toLocaleDateString('en-IN', {
                                                    weekday: 'long',
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {selectedMeeting.location}
                                            </span>
                                        </CardDescription>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedMeeting(null)}>
                                    ✕
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="space-y-3">
                                <h4 className="font-semibold text-sm uppercase text-gray-500 tracking-wider flex items-center gap-2">
                                    <FileSearch className="w-4 h-4" />
                                    Executive Summary
                                </h4>
                                <p className="text-gray-800 leading-relaxed bg-gray-50 p-4 rounded-lg border">
                                    {selectedMeeting.summary}
                                </p>
                            </div>

                            {selectedMeeting.decisions.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-sm uppercase text-gray-500 tracking-wider flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Key Decisions & Action Items
                                    </h4>
                                    <ul className="space-y-3">
                                        {selectedMeeting.decisions.map((decision, idx) => (
                                            <li key={idx} className="flex gap-3 text-sm bg-green-50 p-3 rounded-lg border border-green-100">
                                                <span className="text-green-600 font-bold text-lg">✓</span>
                                                <span className="text-gray-800 flex-1">{decision}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="grid md:grid-cols-2 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
                                <div className="text-center">
                                    <Users className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                                    <p className="text-2xl font-bold text-blue-600">{selectedMeeting.attendees}</p>
                                    <p className="text-xs text-gray-600">Citizens Attended</p>
                                </div>
                                {selectedMeeting.budget && (
                                    <div className="text-center">
                                        <TrendingUp className="w-8 h-8 mx-auto text-green-600 mb-2" />
                                        <p className="text-2xl font-bold text-green-600">{selectedMeeting.budget}</p>
                                        <p className="text-xs text-gray-600">Budget Discussed</p>
                                    </div>
                                )}
                            </div>

                            <div className="text-xs text-gray-500 border-t pt-4 italic flex items-start gap-2">
                                <FileSearch className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                <span>
                                    This summary was auto-generated by JanAI Agent from official meeting minutes.
                                    For official records, please contact your local Panchayat/Ward office.
                                </span>
                            </div>

                            <div className="flex gap-3">
                                <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700" onClick={() => handleNotifyOthers(selectedMeeting.title)}>
                                    <Bell className="w-4 h-4" />
                                    Notify My Community
                                </Button>
                                <Button variant="outline" className="gap-2">
                                    <Printer className="w-4 h-4" />
                                    Print
                                </Button>
                                <Button variant="outline" className="gap-2">
                                    <Share2 className="w-4 h-4" />
                                    Share
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
