function Footer() {
    return (
        <footer className="bg-black text-gray-400 py-12">
            <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-4 sm:px-6 lg:px-8">
                <div>
                    <h2 className="text-white text-lg font-semibold mb-4">About Us</h2>
                    <p className="mb-4">
                        Harmony AI is a cutting-edge classical music generation platform that 
                        blends centuries of musical tradition with modern AI technology. 
                        We empower composers, producers, and enthusiasts to create 
                        authentic classical compositions with unprecedented ease.
                    </p>
                </div>
                <div>
                    <h2 className="text-white text-lg font-semibold mb-4">Quick Links</h2>
                    <ul>
                        <li>
                            <a
                                href="#"
                                className="hover:text-white transition-colors duration-300"
                            >
                                Home
                            </a>
                        </li>
                        <li>
                            <a
                                href="#"
                                className="hover:text-white transition-colors duration-300"
                            >
                                Features
                            </a>
                        </li>
                        <li>
                            <a
                                href="#"
                                className="hover:text-white transition-colors duration-300"
                            >
                                Gallery
                            </a>
                        </li>
                        
                    </ul>
                </div>
                <div>
                    <h2 className="text-white text-lg font-semibold mb-4">Follow Us</h2>
                    <div className="flex space-x-4">
                        <a
                            href="#"
                            className="hover:text-white transition-colors duration-300"
                        >
                            Facebook
                        </a>
                        <a
                            href="#"
                            className="hover:text-white transition-colors duration-300"
                        >
                            Twitter
                        </a>
                        <a
                            href="#"
                            className="hover:text-white transition-colors duration-300"
                        >
                            SoundCloud
                        </a>
                    </div>
                </div>
                <div>
                    <h2 className="text-white text-lg font-semibold mb-4">Contact Us</h2>
                    <p>Indian institute of technology,Patna</p>
                    <p>Bihar-801103</p>
                    <p>Email: OxJtM@example.com</p>
                    <p>Phone: (123) 456-7890</p>
                </div>
            </div>
            <p className="text-center text-xs pt-8">&#169; 2025 Harmony AI. All rights reserved.</p>
        </footer>
    )
}

export default Footer