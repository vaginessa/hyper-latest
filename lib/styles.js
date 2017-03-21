module.exports = `
  * { box-sizing: border-box; }
  body, html {
    padding: 0;
  }

  a {
    color: #FF2E88;
    transition: 300ms ease;
  }

  a:visited {
    opacity: 0.8;
  }

  a:hover {
    color: #50E3C2;
  }

  .a--changelog, .a--repolink {
    text-decoration: none;
    color: #FFF;
  }

  .a--changelog .tag {
    margin-right: 10px;
  }

  .a--relative {
    position: relative;
    text-decoration: none;
    color: #FFF;
  }
  .a--relative:before {
    content: '#';
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    transform: translateX(-100%);
    font-weight: 100;
    color: #FF2E88;
  }

  a:hover .tag {
    opacity: .9;
  }

  .a--shade {
    color: #333;
    font-weight: 300;
  }

  .tag {
    border-radius: 3px;
    background: -webkit-gradient(linear, left top, left bottom, color-stop(0%, rgba(254,30,173,1)), color-stop(100%, #E76027));
    padding: 1px 6px;
    color: #FFF;
    font-weight: 200;
    transition: 300ms ease;
  }

  .repo {
    font-weight: 100
  }
  .repo--org {}
  .repo--separator {}
  .repo--name {
    font-weight: bold;
  }

  i {
    font-style: normal;
    opacity: .9;
    font-weight: 200;
  }

  ul {
    padding: 0;
  }

  li {
    list-style: none;
    padding: 10px 0;
  }

  body {
    font-family: sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #000;
    color: #FFF;
  }

  .content {
    max-width: 800px;
    min-width: 360px;
  }

  img {
    max-width: 100%;
    margin: 40px;
  }

  .flex {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
`
