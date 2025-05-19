import React from 'react';
import { motion } from 'framer-motion';

interface PageContainerProps {
    title: string;
    children: React.ReactNode;
}

const pageVariants = {
    initial: {
        opacity: 0,
        y: 20,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: "easeInOut",
        },
    },
    exit: {
        opacity: 0,
        y: -20,
        transition: {
            duration: 0.3,
            ease: "easeInOut",
        },
    },
};

const PageContainer: React.FC<PageContainerProps> = ({ title, children }) => {
    return (
        <motion.div
            className="pure-container py-8"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
        >
            <h1 className="text-3xl font-bold mb-8 text-white">{title}</h1>
            {children}
        </motion.div>
    );
};

export default PageContainer;