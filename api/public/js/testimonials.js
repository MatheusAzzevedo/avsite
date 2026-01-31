/**
 * Explicação da função [TestimonialsCarousel]: Gerencia o carrossel de depoimentos
 * Rotaciona automaticamente a cada 8 segundos, permite navegação manual via setas
 * e dots de navegação. Implementa transições suaves e controle de estados.
 */

class TestimonialsCarousel {
  constructor() {
    this.testimonials = [
      {
        name: "Rosangela de Almeida Silva",
        text: '"Parabéns pela competência, atenção com os pais e cuidado com nossos filhos. Uma viagem de muito conhecimento e diversão. Meu filho simplesmente amou."',
        role: "Mãe",
        initials: "RA"
      },
      {
        name: "Roberta Starling",
        text: '"Quero agradecer pela excelente viagem que vocês proporcionaram para o meu filho. Ele amou tudo. Agradeço a todos os envolvidos pelo carinho, cuidado e organização."',
        role: "Mãe",
        initials: "RS"
      },
      {
        name: "Elaine Guedes",
        text: '"Queremos agradecer a toda a equipe Avoar Turismo pela atenção, dedicação e carinho com a turma do Ensino Fundamental do Centro Educacional São Tomás de Aquino."',
        role: "Educadora",
        initials: "EG"
      },
      {
        name: "Gabriela Cortez",
        text: '"A experiência foi incrível, muito organizada e explicativa. As informações em tempo real me deram mais segurança e tranquilidade."',
        role: "Mãe",
        initials: "GC"
      },
      {
        name: "Solange Roberto",
        text: '"O passeio foi incrível! A equipe Avoar é bastante atenciosa e organizada. Certamente faremos novos passeios e recomendamos a empresa."',
        role: "Mãe",
        initials: "SR"
      },
      {
        name: "Mariana Pamplona",
        text: '"Excelente empresa, muito séria. Meu filho amou a excursão e, como mãe, fiquei tranquila e feliz."',
        role: "Mãe",
        initials: "MP"
      },
      {
        name: "Giselle Vieira",
        text: '"Equipe muito boa, proposta de passeio bem estruturada e organizada, comprometida com a segurança. Comunicação clara e frequente com os pais."',
        role: "Educadora",
        initials: "GV"
      },
      {
        name: "Roberto Miguel Gonçalves Jr.",
        text: '"Agradeço à equipe Avoar Turismo Pedagógico pelo profissionalismo e responsabilidade com nossos jovens do Colégio M2 na viagem sobre biologia marinha."',
        role: "Coordenador",
        initials: "RG"
      },
      {
        name: "Josana Reis",
        text: '"Excelente! Ponto de partida para ótimos lugares a se conhecer. Equipe muito eficiente."',
        role: "Mãe",
        initials: "JR"
      },
      {
        name: "Lucila Matoso",
        text: '"Equipe atenciosa e preparada para lidar com adolescentes. Durante a preparação e a viagem, passaram informações claras e seguras."',
        role: "Educadora",
        initials: "LM"
      },
      {
        name: "Adir Prof",
        text: '"Grupo excelente! Extremamente profissionais, atentos aos mínimos detalhes."',
        role: "Educador",
        initials: "AP"
      },
      {
        name: "Luana Felix",
        text: '"Minha filha fez o passeio de Biologia Marinha. Empresa confiável e organizada."',
        role: "Mãe",
        initials: "LF"
      },
      {
        name: "Merato Merato",
        text: '"Excelente viagem BH–Rio–Petrópolis. Atendimento profissional e acolhedor. Nota 10!"',
        role: "Viajante",
        initials: "MM"
      },
      {
        name: "Esther Miranda",
        text: '"A experiência foi incrível! Os recreadores tornaram tudo ainda melhor. Organização excelente."',
        role: "Mãe",
        initials: "EM"
      },
      {
        name: "Erica Ribeiro",
        text: '"Equipe super qualificada e organizada. A excursão do colégio do meu filho foi ótima. Pudemos acompanhar tudo com fotos e localização em tempo real."',
        role: "Mãe",
        initials: "ER"
      },
      {
        name: "Kele Gonçalves",
        text: '"Excelente trabalho. Muito cuidado com os alunos, seriedade e aprofundamento nas informações durante o trabalho de campo."',
        role: "Educadora",
        initials: "KG"
      },
      {
        name: "Daniele Carvalho Nery Tomagnini",
        text: '"Maravilhosa! Uma experiência inesquecível."',
        role: "Mãe",
        initials: "DC"
      },
      {
        name: "Juliana Sayure",
        text: '"Meu filho gostou muito do passeio e, como mãe, gostei da comunicação constante pelo WhatsApp com horários e atividades."',
        role: "Mãe",
        initials: "JS"
      },
      {
        name: "Simone Bomfim",
        text: '"No início fiquei apreensiva, mas a organização, os monitores e o acompanhamento em tempo real trouxeram muita segurança."',
        role: "Mãe",
        initials: "SB"
      },
      {
        name: "Simone Celeghini Albino",
        text: '"Passeio pedagógico tranquilo, bem organizado e seguro. Almoço excelente e fotos durante todo o passeio."',
        role: "Educadora",
        initials: "SC"
      },
      {
        name: "Cat Detran",
        text: '"Excelente empresa. Viagem organizada, com total assistência e conforto. Os alunos amaram."',
        role: "Educadora",
        initials: "CD"
      },
      {
        name: "Wanderson Wadjo M. Resende",
        text: '"Minha filha teve momentos incríveis na excursão. Lembranças que levará para a vida toda. Obrigado pelo cuidado e carinho."',
        role: "Pai",
        initials: "WW"
      },
      {
        name: "Silvia Andrade",
        text: '"Experiência única para a vida. Equipe maravilhosa, prestativa e responsável. Nos manteve informados durante toda a viagem."',
        role: "Mãe",
        initials: "SA"
      },
      {
        name: "Mozart Vieira Pires Filho",
        text: '"Experiência maravilhosa, com aprendizado e diversão. Gratidão pela atenção, cuidado e respeito."',
        role: "Viajante",
        initials: "MV"
      },
      {
        name: "Raquel Bizarri",
        text: '"Excelente empresa! Meu filho amou a excursão para Ouro Preto. Fotos e localização em tempo real. Super indico!"',
        role: "Mãe",
        initials: "RB"
      },
      {
        name: "Fabrizzio Cícero de Castro",
        text: '"Experiência incrível! Pude ver diversos animais marinhos e realizar o sonho de mergulhar. Agradeço à equipe Avoar Turismo."',
        role: "Viajante",
        initials: "FC"
      },
      {
        name: "Silvana Camargos",
        text: '"Meu filho ficou muito feliz. Contou tudo com detalhes. Gratidão por toda organização e cuidado."',
        role: "Mãe",
        initials: "SC"
      }
    ];

    this.currentIndex = 0;
    this.autoPlayInterval = null;
    this.autoPlayDelay = 8000; // 8 segundos

    this.init();
  }

  init() {
    // Só inicializar se existir a seção de depoimentos (evita conflito com outras páginas)
    const section = document.querySelector('.testimonials-section');
    if (!section) return;

    // Renderizar depoimentos no carousel desta seção
    this.render();

    // Anexar event listeners dentro da seção
    const prevBtn = section.querySelector('.testimonials-arrow.prev');
    const nextBtn = section.querySelector('.testimonials-arrow.next');

    if (prevBtn) prevBtn.addEventListener('click', () => this.prev());
    if (nextBtn) nextBtn.addEventListener('click', () => this.next());

    // Dots: delegação de evento no container (funciona com dots gerados dinamicamente)
    const dotsContainer = section.querySelector('.testimonials-dots');
    if (dotsContainer) {
      dotsContainer.addEventListener('click', (e) => {
        const dot = e.target.closest('.dot');
        if (dot) {
          const index = Array.from(dotsContainer.querySelectorAll('.dot')).indexOf(dot);
          if (index >= 0) this.goTo(index);
        }
      });
    }

    // Iniciar auto-play
    this.startAutoPlay();

    // Pausar ao passar mouse, retomar ao sair
    const carousel = section.querySelector('.testimonials-carousel');
    if (carousel) {
      carousel.addEventListener('mouseenter', () => this.pauseAutoPlay());
      carousel.addEventListener('mouseleave', () => this.startAutoPlay());
    }
  }

  render() {
    const carousel = document.querySelector('.testimonials-section .testimonials-carousel');
    if (!carousel) return;

    // Limpar itens existentes
    carousel.querySelectorAll('.testimonial-item').forEach(item => item.remove());

    // Renderizar depoimentos
    this.testimonials.forEach((testimonial, index) => {
      const item = document.createElement('div');
      item.className = `testimonial-item ${index === this.currentIndex ? 'active' : ''}`;

      item.innerHTML = `
        <div class="testimonial-stars">
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
        </div>
        <p class="testimonial-text">${testimonial.text}</p>
        <div class="testimonial-author">
          <div class="testimonial-avatar">${testimonial.initials}</div>
          <div class="testimonial-info">
            <h4>${testimonial.name}</h4>
          </div>
        </div>
      `;

      carousel.appendChild(item);
    });

    // Atualizar dots
    this.updateDots();
  }

  updateDots() {
    const section = document.querySelector('.testimonials-section');
    if (!section) return;
    const dots = section.querySelectorAll('.testimonials-dots .dot');
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === this.currentIndex);
    });
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.testimonials.length;
    this.update();
  }

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.testimonials.length) % this.testimonials.length;
    this.update();
  }

  goTo(index) {
    this.currentIndex = index;
    this.update();
  }

  update() {
    const carousel = document.querySelector('.testimonials-section .testimonials-carousel');
    if (!carousel) return;
    const items = carousel.querySelectorAll('.testimonial-item');
    items.forEach((item, index) => {
      item.classList.remove('active', 'prev');
      if (index === this.currentIndex) {
        item.classList.add('active');
      } else if (index === (this.currentIndex - 1 + this.testimonials.length) % this.testimonials.length) {
        item.classList.add('prev');
      }
    });

    this.updateDots();
    this.resetAutoPlay();
  }

  startAutoPlay() {
    this.autoPlayInterval = setInterval(() => this.next(), this.autoPlayDelay);
  }

  pauseAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }

  resetAutoPlay() {
    this.pauseAutoPlay();
    this.startAutoPlay();
  }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  new TestimonialsCarousel();
});
