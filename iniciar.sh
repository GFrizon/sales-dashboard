#!/bin/bash
echo "========================================="
echo " Dashboard de Vendas - Iniciando..."
echo "========================================="

# Backend
cd backend
npm install --silent &
npm run dev &
BACKEND_PID=$!
cd ..

sleep 3

# Frontend
cd frontend
npm install --silent &
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "Backend  PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Acesse: http://localhost:3000"
echo ""
echo "Para parar: kill $BACKEND_PID $FRONTEND_PID"

wait
