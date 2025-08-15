import React, { useState } from "react";
import "./CocktailRecipes.css";

const cocktails = [
  { 
    name: "🍸 Gin & Tonic", 
    recipe: [
      { text: "1 Gin", color: "#d4e2f0" },
      { text: "Tonic", color: "#f4f4f4" }
    ], 
    fun: "Bubbles of joy!" 
  },
  { 
    name: "🍹 Aperol Spritz", 
    recipe: [
      { text: "1 Aperol", color: "#ff6f3c" },
      { text: "1 Champagne", color: "#f7e9b4" },
      { text: "2 Nabeglavi", color: "#b3e0ff" },
      { text: "1.5 Tonic", color: "#f4f4f4" }
    ], 
    fun: "Sunset in a glass 🌅" 
  },
  { 
    name: "🍸 Martini", 
    recipe: [
      { text: "15ml Gin", color: "#d4e2f0" },
      { text: "Martini", color: "#fdf6d4" },
      { text: "3 Olives", color: "#b2c248" }
    ], 
    fun: "Shaken, not stirred 😉" 
  },
  { 
    name: "🍒 Jäger & Cherry", 
    recipe: [
      { text: "1 Jäger", color: "#605151ff" },
      { text: "Cherry Juice", color: "#b30000" }
    ], 
    fun: "Party fuel 🔥" 
  },
  { 
    name: "🥂 Mimosa", 
    recipe: [
      { text: "1/2 Orange Juice", color: "#ffa500" },
      { text: "1/2 Champagne", color: "#f7e9b4" }
    ], 
    fun: "Breakfast of champions 🥳" 
  },
];

export default function CocktailRecipes() {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="cocktail-container">
      <h2 className="cocktail-title">🍹 Cocktail Recipes</h2>
      <div className="cocktail-grid">
        {cocktails.map((c, i) => {
          const layerHeight = 100 / c.recipe.length; // evenly divide
          return (
            <div 
              key={i} 
              className={`cocktail-card ${hovered === i ? "hovered" : ""}`}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <h3>{c.name}</h3>
              <div className="cocktail-glass">
                {c.recipe.map((ingredient, idx) => (
                  <div 
                    key={idx} 
                    className="ingredient-layer" 
                    style={{ 
                      backgroundColor: ingredient.color, 
                      height: `${layerHeight}%`,
                      bottom: `${idx * layerHeight}%`, 
                      animationDelay: `${idx * 0.3}s` 
                    }}
                  >
                    {ingredient.text}
                  </div>
                ))}
                <div className="glass-emoji">🥂</div>
              </div>
              <p className="cocktail-fun">{c.fun}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
